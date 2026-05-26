import { NextResponse } from "next/server";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { serverApiUrl } from "@/lib/server-api-url";

export async function POST(req: Request) {
  if (!commerceUsesDatabase()) {
    return NextResponse.json(
      {
        error:
          "Cadastro público indisponível: configure a API com banco de dados e a integração interna no servidor.",
      },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const res = await fetch(`${serverApiUrl()}/public/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let json: { message?: string | string[]; user?: unknown; registrationEmailSent?: boolean };
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
          : "Não foi possível concluir o cadastro.";
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ ok: true, user: json.user, registrationEmailSent: json.registrationEmailSent });
}
