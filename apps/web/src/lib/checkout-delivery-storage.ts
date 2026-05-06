"use client";

import type { CheckoutDelivery } from "@/lib/checkout-delivery-types";
import { isCheckoutDeliveryComplete, normalizeCheckoutDelivery } from "@/lib/checkout-delivery-types";

const KEY = "moda_checkout_delivery_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readCheckoutDelivery(): Partial<CheckoutDelivery> | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== "object" || v === null) return null;
    return v as Partial<CheckoutDelivery>;
  } catch {
    return null;
  }
}

export function writeCheckoutDelivery(d: CheckoutDelivery): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(KEY, JSON.stringify(normalizeCheckoutDelivery(d)));
}

export function readCheckoutDeliveryComplete(): CheckoutDelivery | null {
  const d = readCheckoutDelivery();
  if (!isCheckoutDeliveryComplete(d)) return null;
  return normalizeCheckoutDelivery(d);
}
