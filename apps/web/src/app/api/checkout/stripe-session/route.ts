import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import type { CartLine } from "@/lib/cart-types";
import { cartLineLabel } from "@/lib/cart-line-label";
import { resolvePublicRedirectOrigin } from "@/lib/public-redirect-origin";
import { getStripeServer } from "@/lib/stripe-server";
import {
  commerceUsesDatabase,
  fetchCheckoutFreteInsumosBreakdownPublic,
  fetchCheckoutShippingQuotePublic,
} from "@/lib/commerce-backend";

const MAX_LINES = 20;

function isCartLine(x: unknown): x is CartLine {
  if (typeof x !== "object" || x === null) return false;
  const l = x as Record<string, unknown>;
  return (
    typeof l.listingId === "string" &&
    typeof l.productSlug === "string" &&
    typeof l.productName === "string" &&
    typeof l.unitPrice === "number" &&
    typeof l.quantity === "number" &&
    typeof l.maxQuantity === "number" &&
    typeof l.executorNome === "string" &&
    (typeof l.size === "undefined" || typeof l.size === "string")
  );
}

export async function POST(req: Request) {
  const stripe = getStripeServer();
  if (!stripe) {
    return NextResponse.json(
      { error: "Pagamentos Stripe não estão configurados (STRIPE_SECRET_KEY)." },
      { status: 503 },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Faça login para pagar." }, { status: 401 });
  }
  if (session.role !== "CUSTOMER") {
    return NextResponse.json(
      { error: "Somente contas de cliente podem finalizar compra com pagamento na loja." },
      { status: 403 },
    );
  }
  if (session.accountStatus && session.accountStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Conta não ativa para compra." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const rawLines =
    typeof body === "object" && body !== null && "lines" in body
      ? (body as { lines: unknown }).lines
      : null;
  if (!Array.isArray(rawLines) || rawLines.length === 0 || rawLines.length > MAX_LINES) {
    return NextResponse.json({ error: "Carrinho inválido." }, { status: 400 });
  }

  const lines: CartLine[] = [];
  for (const row of rawLines) {
    if (!isCartLine(row)) {
      return NextResponse.json({ error: "Formato de item inválido." }, { status: 400 });
    }
    if (row.quantity < 1 || row.quantity > row.maxQuantity || row.quantity > 99) {
      return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
    }
    if (row.unitPrice <= 0 || row.unitPrice > 500_000 || !Number.isFinite(row.unitPrice)) {
      return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
    }
    lines.push(row);
  }

  const cepRaw =
    typeof body === "object" && body !== null && "cep_destino" in body
      ? (body as { cep_destino?: unknown }).cep_destino
      : null;
  const cepDestino =
    typeof cepRaw === "string" ? cepRaw.replace(/\D/g, "").slice(0, 8) : "";
  if (cepDestino.length !== 8) {
    return NextResponse.json(
      { error: "Informe o CEP de entrega (8 dígitos) para calcular o frete." },
      { status: 400 },
    );
  }

  const reserveLines = lines.map((l) => ({ listing_id: l.listingId, quantity: l.quantity }));
  let freightBrl = 0;
  try {
    if (!commerceUsesDatabase()) {
      return NextResponse.json(
        { error: "Cotação de frete exige API configurada (COMMERCE_API_URL) e Melhor Envio." },
        { status: 503 },
      );
    }
    freightBrl = (await fetchCheckoutShippingQuotePublic(cepDestino, reserveLines)).total_frete_brl;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Não foi possível cotar o frete.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  /** Componente de frete insumo→costureira embutido no preço (para split Connect: fica na plataforma). */
  let freteInsumosTotalBrl: number | undefined;
  try {
    if (commerceUsesDatabase()) {
      freteInsumosTotalBrl = (
        await fetchCheckoutFreteInsumosBreakdownPublic(reserveLines)
      ).total_frete_insumos_brl;
    }
  } catch {
    /* metadata opcional; não bloqueia checkout */
  }

  const lineItems = lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency: "brl" as const,
      unit_amount: Math.round(l.unitPrice * 100),
      product_data: {
        name: l.size
          ? `${cartLineLabel(l)} (${l.executorNome})`
          : `${l.productName} (${l.executorNome})`,
        metadata: { listingId: l.listingId, slug: l.productSlug, ...(l.size ? { size: l.size } : {}) },
      },
    },
  }));

  for (const item of lineItems) {
    if (item.price_data.unit_amount < 50) {
      return NextResponse.json(
        { error: "Valor mínimo por linha no Stripe (BRL) é R$0,50." },
        { status: 400 },
      );
    }
  }

  const freightCents =
    freightBrl > 0 ? Math.max(50, Math.round(freightBrl * 100)) : 0;
  if (freightCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "brl" as const,
        unit_amount: freightCents,
        product_data: {
          name: "Frete (entrega estimada)",
          metadata: { listingId: "", slug: "frete" },
        },
      },
    });
  }

  const origin = resolvePublicRedirectOrigin(req);
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.email,
      line_items: lineItems,
      success_url: `${origin}/checkout/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        customer_email: session.email,
        cep_destino: cepDestino,
        shipping_brl: String(freightBrl),
        ...(freteInsumosTotalBrl !== undefined
          ? { frete_insumos_total_brl: String(freteInsumosTotalBrl) }
          : {}),
        listing_ids: lines
          .map((l) => l.listingId)
          .join(",")
          .slice(0, 450),
      },
      payment_intent_data: {
        metadata: {
          customer_email: session.email,
          ...(freteInsumosTotalBrl !== undefined
            ? { frete_insumos_total_brl: String(freteInsumosTotalBrl) }
            : {}),
        },
      },
    });
    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Não foi possível criar a sessão de pagamento." },
        { status: 500 },
      );
    }
    return NextResponse.json({ url: checkoutSession.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar sessão Stripe.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
