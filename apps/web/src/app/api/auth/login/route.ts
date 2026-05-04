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
    try {
      const apiRes = await fetch(`${base}/public/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      });
      if (apiRes.ok) {
        const data = (await apiRes.json()) as { user?: ApiLoginUser };
        const u = data.user;
        if (u && isRole(u.role)) {
          const st = u.status;
          const accountStatus: AccountStatus | undefined =
            st === "PENDING_ADMIN_REVIEW" || st === "ACTIVE" || st === "REJECTED" ? st : undefined;
          if (accountStatus) {
            tokenPayload = {
              email: u.email.trim().toLowerCase(),
              role: u.role,
              name: u.name,
              sub: u.id,
              accountStatus,
            };
          }
        }
      }
    } catch {
      /* fallback mock */
    }
  }

  if (!tokenPayload) {
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
