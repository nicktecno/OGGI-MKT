import type { CartLine, CartState } from "@/lib/cart-types";
import { cartLinesMatch } from "@/lib/cart-line-label";

export const CART_STORAGE_KEY = "moda_store_cart_v1";
export const CART_CHANGED_EVENT = "moda-store-cart-changed";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function emitChanged() {
  if (isBrowser()) {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
  }
}

function parse(raw: string | null): CartState {
  if (!raw) return { version: 1, lines: [] };
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== "object" || v === null || !Array.isArray((v as CartState).lines)) {
      return { version: 1, lines: [] };
    }
    const lines = (v as CartState).lines.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CartLine).listingId === "string" &&
        typeof (l as CartLine).productSlug === "string" &&
        typeof (l as CartLine).productName === "string" &&
        typeof (l as CartLine).unitPrice === "number" &&
        typeof (l as CartLine).quantity === "number" &&
        typeof (l as CartLine).maxQuantity === "number" &&
        typeof (l as CartLine).executorNome === "string" &&
        (typeof (l as CartLine).size === "undefined" || typeof (l as CartLine).size === "string"),
    );
    return { version: 1, lines };
  } catch {
    return { version: 1, lines: [] };
  }
}

export function readCart(): CartState {
  if (!isBrowser()) return { version: 1, lines: [] };
  return parse(localStorage.getItem(CART_STORAGE_KEY));
}

export function writeCart(state: CartState): void {
  if (!isBrowser()) return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  emitChanged();
}

export function cartLineCount(state: CartState): number {
  return state.lines.reduce((n, l) => n + l.quantity, 0);
}

export function cartTotal(state: CartState): number {
  return state.lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
}

export function addOrMergeLine(line: Omit<CartLine, "quantity"> & { quantity?: number }): CartState {
  const prev = readCart();
  const qty = Math.min(
    Math.max(1, line.quantity ?? 1),
    Math.max(1, line.maxQuantity),
  );
  const idx = prev.lines.findIndex((l) => cartLinesMatch(l, line.listingId, line.size));
  let lines: CartLine[];
  if (idx === -1) {
    lines = [
      ...prev.lines,
      {
        listingId: line.listingId,
        productSlug: line.productSlug,
        productName: line.productName,
        size: line.size,
        unitPrice: line.unitPrice,
        maxQuantity: line.maxQuantity,
        executorNome: line.executorNome,
        imageUrl: line.imageUrl,
        quantity: qty,
      },
    ];
  } else {
    lines = prev.lines.map((l, i) => {
      if (i !== idx) return l;
      const nextQty = Math.min(l.maxQuantity, l.quantity + qty);
      return { ...l, quantity: nextQty };
    });
  }
  const next = { version: 1 as const, lines };
  writeCart(next);
  return next;
}

export function setLineQuantity(listingId: string, quantity: number, size?: string): CartState {
  const prev = readCart();
  const lines = prev.lines
    .map((l) => {
      if (!cartLinesMatch(l, listingId, size)) return l;
      const q = Math.min(Math.max(0, quantity), l.maxQuantity);
      return { ...l, quantity: q };
    })
    .filter((l) => l.quantity > 0);
  const next = { version: 1 as const, lines };
  writeCart(next);
  return next;
}

export function removeLine(listingId: string, size?: string): CartState {
  const prev = readCart();
  const lines = prev.lines.filter((l) => !cartLinesMatch(l, listingId, size));
  const next = { version: 1 as const, lines };
  writeCart(next);
  return next;
}

export function clearCart(): void {
  writeCart({ version: 1, lines: [] });
}
