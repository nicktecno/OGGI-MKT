import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import type { CartLine } from "@/lib/cart-types";
import { getStripeServer } from "@/lib/stripe-server";

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
    typeof l.executorNome === "string"
  );
}

function requestOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  return new URL(req.url).origin;
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
      { error: "Somente contas de cliente podem usar o checkout pago da loja." },
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

  const lineItems = lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency: "brl" as const,
      unit_amount: Math.round(l.unitPrice * 100),
      product_data: {
        name: `${l.productName} (${l.executorNome})`,
        metadata: { listingId: l.listingId, slug: l.productSlug },
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

  const origin = requestOrigin(req);
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.email,
      line_items: lineItems,
      success_url: `${origin}/checkout/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        customer_email: session.email,
        listing_ids: lines
          .map((l) => l.listingId)
          .join(",")
          .slice(0, 450),
      },
      payment_intent_data: {
        metadata: { customer_email: session.email },
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
