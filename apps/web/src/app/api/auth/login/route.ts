import { NextResponse } from "next/server";
import { authenticateMockUser } from "@/lib/mock-users";
import { dashboardPathForRole, isRole, type Role } from "@/lib/auth-types";
import { SESSION_COOKIE, createSessionToken, type AccountStatus } from "@/lib/auth-token";
import { safeInternalPath } from "@/lib/safe-redirect";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { serverApiUrl } from "@/lib/server-api-url";

type ApiLoginUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
};

function messageFromApiJson(json: { message?: string | string[] }, fallback: string): string {
  const m = json.message;
  if (typeof m === "string" && m.trim()) return m.trim();
  if (Array.isArray(m) && m.length) return m.map(String).join(", ");
  return fallback;
}

export async function POST(req: Request) {
  let body: { email?: string; password?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json(
      { error: "E-mail e senha são obrigatórios" },
      { status: 400 },
    );
  }

  let tokenPayload: {
    email: string;
    role: Role;
    name?: string;
    sub?: string;
    accountStatus?: AccountStatus;
  } | null = null;

  if (commerceUsesDatabase()) {
    const base = serverApiUrl();
    let apiRes: Response;
    try {
      apiRes = await fetch(`${base}/public/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Erro de rede";
      return NextResponse.json(
        {
          error: `Não foi possível contactar o servidor de contas (${base}). ${detail}`,
        },
        { status: 503 },
      );
    }

    const text = await apiRes.text();
    let data: { user?: ApiLoginUser; message?: string | string[] };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      return NextResponse.json(
        { error: "Resposta inválida do servidor de autenticação." },
        { status: 502 },
      );
    }

    if (!apiRes.ok) {
      return NextResponse.json(
        {
          error: messageFromApiJson(
            data,
            apiRes.status === 401 ? "E-mail ou senha incorretos." : "Não foi possível entrar.",
          ),
        },
        { status: apiRes.status >= 400 && apiRes.status < 600 ? apiRes.status : 400 },
      );
    }

    const u = data.user;
    if (!u || !isRole(u.role)) {
      return NextResponse.json(
        { error: "Conta inválida retornada pela API." },
        { status: 502 },
      );
    }
    const st = u.status;
    const accountStatus: AccountStatus | undefined =
      st === "PENDING_ADMIN_REVIEW" || st === "ACTIVE" || st === "REJECTED" ? st : undefined;
    if (!accountStatus) {
      return NextResponse.json(
        { error: "Estado da conta não reconhecido. Contacte o suporte." },
        { status: 502 },
      );
    }
    tokenPayload = {
      email: u.email.trim().toLowerCase(),
      role: u.role,
      name: u.name,
      sub: u.id,
      accountStatus,
    };
  } else {
    const user = authenticateMockUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 },
      );
    }
    tokenPayload = {
      email: user.email,
      role: user.role,
      name: user.name,
      accountStatus: "ACTIVE",
    };
  }

  let token: string;
  try {
    token = await createSessionToken(tokenPayload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro de configuração";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const fallback = dashboardPathForRole(tokenPayload.role);
  const redirect = safeInternalPath(body.next, fallback);
  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
