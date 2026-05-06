import Stripe from "stripe";
import {
  notifyStoreOrderCompleted,
  persistCheckoutReserve,
  type CheckoutReserveLine,
} from "@/lib/commerce-backend";
import { getStripeServer } from "@/lib/stripe-server";
import { getSession } from "@/lib/session";

const META_KEY = "stock_settled";

/**
 * Após Checkout Session paga: baixa estoque na API/cookie demo.
 * Idempotente via `metadata.stock_settled` no PaymentIntent.
 * Envia e-mail de confirmação (Resend na API) quando configurado.
 */
export async function finalizeStripePaidCheckoutInventory(
  checkoutSessionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const stripe = getStripeServer();
  if (!stripe) {
    return { ok: false, message: "Stripe não configurado." };
  }

  let stripeCheckoutSession: Stripe.Checkout.Session;
  try {
    stripeCheckoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
      expand: ["customer_details"],
    });
  } catch {
    return { ok: false, message: "Sessão de checkout inválida." };
  }

  if (stripeCheckoutSession.payment_status !== "paid") {
    return { ok: true };
  }

  const piRef = stripeCheckoutSession.payment_intent;
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
  const emailLines: { productName: string; quantity: number; unitPriceBrl: number }[] = [];

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

      const desc = (item.description ?? "Item").trim();
      const at = item.amount_total;
      const unitBrl =
        qty > 0 && typeof at === "number" && Number.isFinite(at) ? at / 100 / qty : 0;
      emailLines.push({ productName: desc, quantity: qty, unitPriceBrl: unitBrl });
    }
  } catch {
    return { ok: false, message: "Não foi possível ler os itens pagos." };
  }

  if (lines.length === 0) {
    return { ok: false, message: "Sessão sem itens com identificador de estoque." };
  }

  const cust = stripeCheckoutSession.customer_details;
  const customerEmail =
    (typeof stripeCheckoutSession.customer_email === "string" &&
    stripeCheckoutSession.customer_email.includes("@")
      ? stripeCheckoutSession.customer_email
      : null) ??
    (cust && typeof cust.email === "string" && cust.email.includes("@") ? cust.email : null);

  const customerName =
    cust && typeof cust.name === "string" && cust.name.trim() ? cust.name.trim() : undefined;

  const userSession = await getSession();
  const totalBrlPaid =
    typeof stripeCheckoutSession.amount_total === "number" && stripeCheckoutSession.amount_total > 0
      ? stripeCheckoutSession.amount_total / 100
      : undefined;

  const customerOrderPersist =
    userSession?.sub &&
    userSession.role === "CUSTOMER" &&
    customerEmail &&
    userSession.email.trim().toLowerCase() === customerEmail.trim().toLowerCase()
      ? {
          account_id: userSession.sub,
          customer_email: customerEmail,
          customer_name: customerName ?? userSession.name,
          channel: "stripe" as const,
          stripe_session_id: checkoutSessionId,
          total_brl: totalBrlPaid ?? null,
        }
      : undefined;

  try {
    await persistCheckoutReserve(lines, customerOrderPersist);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao baixar estoque.";
    return { ok: false, message: msg };
  }

  if (customerEmail && emailLines.length > 0) {
    await notifyStoreOrderCompleted({
      channel: "stripe",
      customerEmail,
      customerName,
      lines: emailLines,
      stripeSessionId: checkoutSessionId,
      totalBrl: totalBrlPaid,
    });
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
