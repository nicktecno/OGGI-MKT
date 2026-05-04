"use client";

import { useEffect } from "react";
import { CART_CHANGED_EVENT, clearCart } from "@/lib/cart-storage";

/** Limpa o carrinho local após pagamento confirmado na página de obrigado. */
export function CheckoutClearAfterPayment() {
  useEffect(() => {
    clearCart();
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
  }, []);
  return null;
}
