import { NextResponse } from "next/server";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { serverApiUrl } from "@/lib/server-api-url";

export async function POST(req: Request) {
  if (!commerceUsesDatabase()) {
    return NextResponse.json(
      {
        error:
          "Recuperação de senha indisponível: configure a API (COMMERCE_API_URL e INTERNAL_API_SECRET) no servidor.",
      },
      { status: 503 },
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });
  }

  const res = await fetch(`${serverApiUrl()}/public/auth/forgot-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
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
          : "Não foi possível enviar o e-mail.";
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
