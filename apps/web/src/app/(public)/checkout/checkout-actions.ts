"use server";

import { revalidatePath } from "next/cache";
import {
  commerceUsesDatabase,
  getCommerceState,
  notifyStoreOrderCompleted,
  persistCheckoutReserve,
} from "@/lib/commerce-backend";
import { isCheckoutDeliveryComplete, normalizeCheckoutDelivery, type CheckoutDelivery } from "@/lib/checkout-delivery-types";
import { validateCartForCheckout } from "@/lib/checkout-validate";
import { getSession } from "@/lib/session";

export type ConfirmDemoCheckoutResult = { ok: true } | { ok: false; error: string };

export async function confirmCheckoutDemoAction(
  lines: unknown,
  delivery: unknown,
): Promise<ConfirmDemoCheckoutResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Faça login para finalizar o pedido." };
  }
  if (session.role !== "CUSTOMER") {
    return { ok: false, error: "Somente clientes podem finalizar compras na loja." };
  }
  if (session.accountStatus && session.accountStatus !== "ACTIVE") {
    return { ok: false, error: "Conta não ativa para compra." };
  }

  const d =
    typeof delivery === "object" && delivery !== null ? (delivery as Partial<CheckoutDelivery>) : null;
  if (!isCheckoutDeliveryComplete(d)) {
    return { ok: false, error: "Preencha todos os campos de entrega." };
  }

  let state;
  try {
    state = await getCommerceState();
  } catch {
    return { ok: false, error: "Não foi possível carregar o catálogo. Tente de novo." };
  }

  const validated = validateCartForCheckout(lines, state);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const deliveryNorm = normalizeCheckoutDelivery(d);
  const totalBrl = validated.cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const customerOrder =
    session.sub && commerceUsesDatabase()
      ? {
          account_id: session.sub,
          customer_email: session.email,
          customer_name: session.name,
          channel: "demo" as const,
          stripe_session_id: null as string | null,
          total_brl: totalBrl,
          delivery: {
            recipientName: deliveryNorm.recipientName,
            phone: deliveryNorm.phone,
            cep: deliveryNorm.cep,
            street: deliveryNorm.street,
            number: deliveryNorm.number,
            complement: deliveryNorm.complement || undefined,
            neighborhood: deliveryNorm.neighborhood,
            city: deliveryNorm.city,
            uf: deliveryNorm.uf,
          },
        }
      : undefined;

  try {
    await persistCheckoutReserve(validated.reserveLines, customerOrder);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Não foi possível reservar o estoque.";
    return { ok: false, error: msg };
  }
  await notifyStoreOrderCompleted({
    channel: "demo",
    customerEmail: session.email,
    customerName: session.name,
    lines: validated.cart.map((l) => ({
      productName: l.productName,
      quantity: l.quantity,
      unitPriceBrl: l.unitPrice,
    })),
    delivery: {
      recipientName: deliveryNorm.recipientName,
      phone: deliveryNorm.phone,
      cep: deliveryNorm.cep,
      street: deliveryNorm.street,
      number: deliveryNorm.number,
      complement: deliveryNorm.complement || undefined,
      neighborhood: deliveryNorm.neighborhood,
      city: deliveryNorm.city,
      uf: deliveryNorm.uf,
    },
    totalBrl,
  });

  revalidatePath("/loja");
  revalidatePath("/carrinho");
  revalidatePath("/checkout");
  revalidatePath("/painel/cliente");
  revalidatePath("/painel/cliente/pedidos");
  return { ok: true };
}
