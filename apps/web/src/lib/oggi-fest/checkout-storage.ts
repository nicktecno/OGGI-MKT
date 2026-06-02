import type { FestCheckoutDraft } from "./types";

export const FEST_CHECKOUT_STORAGE_KEY = "oggi_fest_checkout_v1";

export function readFestCheckout(): FestCheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FEST_CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as FestCheckoutDraft;
    return v?.version === 1 ? v : null;
  } catch {
    return null;
  }
}

export function writeFestCheckout(draft: FestCheckoutDraft): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FEST_CHECKOUT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearFestCheckout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FEST_CHECKOUT_STORAGE_KEY);
}
