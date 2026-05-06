import { NextResponse } from "next/server";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { serverApiUrl } from "@/lib/server-api-url";

export async function POST(req: Request) {
  if (!commerceUsesDatabase()) {
    return NextResponse.json(
      {
        error:
          "Redefinição de senha indisponível: configure a API (COMMERCE_API_URL e INTERNAL_API_SECRET) no servidor.",
      },
      { status: 503 },
    );
  }

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token || !password) {
    return NextResponse.json({ error: "Token e nova senha são obrigatórios." }, { status: 400 });
  }

  const res = await fetch(`${serverApiUrl()}/public/auth/reset-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password }),
    cache: "no-store",
  });

  const text = await res.text();
  let json: { message?: string | string[] };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    return NextResponse.json({ error: text || `Erro ${res.status}` }, { status: res.status });
  }

  if (!res.ok) {
    const msg = json.message;
    const err =
      typeof msg === "string"
        ? msg
        : Array.isArray(msg)
          ? msg.join(", ")
          : "Não foi possível redefinir a senha.";
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
