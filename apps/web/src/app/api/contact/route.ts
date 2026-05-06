import { NextResponse } from "next/server";
import { serverApiUrl } from "@/lib/server-api-url";

export async function POST(req: Request) {
  const base = serverApiUrl().trim();
  if (!base) {
    return NextResponse.json(
      { error: "Formulário indisponível: configure a URL da API no servidor." },
      { status: 503 },
    );
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const res = await fetch(`${base}/public/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  let json: { message?: string | string[]; ok?: boolean };
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
          : res.status === 503
            ? "Serviço temporariamente indisponível. Tente mais tarde."
            : "Não foi possível enviar a mensagem.";
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
