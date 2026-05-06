"use server";

import { revalidatePath } from "next/cache";
import { getCommerceState, persistCheckoutReserve } from "@/lib/commerce-backend";
import { isCheckoutDeliveryComplete, type CheckoutDelivery } from "@/lib/checkout-delivery-types";
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

  try {
    await persistCheckoutReserve(validated.reserveLines);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Não foi possível reservar o estoque.";
    return { ok: false, error: msg };
  }

  revalidatePath("/loja");
  revalidatePath("/carrinho");
  revalidatePath("/checkout");
  return { ok: true };
}
