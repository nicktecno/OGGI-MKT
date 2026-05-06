import Stripe from "stripe";
import { persistCheckoutReserve, type CheckoutReserveLine } from "@/lib/commerce-backend";
import { getStripeServer } from "@/lib/stripe-server";

const META_KEY = "stock_settled";

/**
 * Após Checkout Session paga: baixa estoque na API/cookie demo.
 * Idempotente via `metadata.stock_settled` no PaymentIntent.
 */
export async function finalizeStripePaidCheckoutInventory(
  checkoutSessionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const stripe = getStripeServer();
  if (!stripe) {
    return { ok: false, message: "Stripe não configurado." };
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  } catch {
    return { ok: false, message: "Sessão de checkout inválida." };
  }

  if (session.payment_status !== "paid") {
    return { ok: true };
  }

  const piRef = session.payment_intent;
  const piId =
    typeof piRef === "string" ? piRef : piRef && typeof piRef === "object" && "id" in piRef ? piRef.id : null;

  if (piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId);
      if (pi.metadata[META_KEY] === "true") {
        return { ok: true };
      }
    } catch {
      // segue para tentar reservar
    }
  }

  const lines: CheckoutReserveLine[] = [];
  try {
    const iter = await stripe.checkout.sessions.listLineItems(checkoutSessionId, {
      limit: 50,
      expand: ["data.price.product"],
    });
    for (const item of iter.data) {
      const qty = item.quantity ?? 0;
      if (!Number.isInteger(qty) || qty < 1) continue;
      const price = item.price;
      if (!price || typeof price === "string") continue;
      const prod = price.product;
      if (!prod || typeof prod === "string") continue;
      const lid = "metadata" in prod ? prod.metadata?.listingId : undefined;
      const listingId = typeof lid === "string" ? lid.trim() : "";
      if (!listingId) continue;
      lines.push({ listing_id: listingId, quantity: qty });
    }
  } catch {
    return { ok: false, message: "Não foi possível ler os itens pagos." };
  }

  if (lines.length === 0) {
    return { ok: false, message: "Sessão sem itens com identificador de estoque." };
  }

  try {
    await persistCheckoutReserve(lines);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao baixar estoque.";
    return { ok: false, message: msg };
  }

  if (piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId);
      await stripe.paymentIntents.update(piId, {
        metadata: { ...pi.metadata, [META_KEY]: "true" },
      });
    } catch {
      // estoque já foi baixado; falha ao marcar idempotência é aceitável no MVP
    }
  }

  return { ok: true };
}
