import { NextResponse } from "next/server";
import {
  commerceUsesDatabase,
  fetchCheckoutShippingQuotePublic,
} from "@/lib/commerce-backend";

export async function POST(req: Request) {
  let body: { cep_destino?: string; lines?: { listing_id: string; quantity: number }[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  const cep = typeof body.cep_destino === "string" ? body.cep_destino : "";
  const lines = Array.isArray(body.lines) ? body.lines : null;
  if (!lines?.length) {
    return NextResponse.json({ message: "Informe o carrinho." }, { status: 400 });
  }

  if (!commerceUsesDatabase()) {
    return NextResponse.json(
      {
        message:
          "Cotação de frete exige API configurada (COMMERCE_API_URL) e Melhor Envio autorizado.",
      },
      { status: 503 },
    );
  }

  try {
    const q = await fetchCheckoutShippingQuotePublic(cep, lines);
    return NextResponse.json(q);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao cotar frete.";
    return NextResponse.json({ message: msg }, { status: 400 });
  }
}
