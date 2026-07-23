import { onlyCepDigits } from "@/lib/viacep";
import type { LoslosStore } from "./types";

/** Distância mock entre CEPs (baseada na diferença numérica dos primeiros 5 dígitos). */
export function estimateCepDistanceKm(cepA: string, cepB: string): number {
  const a = parseInt(onlyCepDigits(cepA).slice(0, 5), 10) || 0;
  const b = parseInt(onlyCepDigits(cepB).slice(0, 5), 10) || 0;
  return Math.round(Math.abs(a - b) * 0.08 * 10) / 10;
}

export function formatCepDisplay(cep: string): string {
  const d = onlyCepDigits(cep);
  if (d.length !== 8) return cep.trim();
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function rankStoresByCep(
  stores: LoslosStore[],
  customerCep: string,
): LoslosStore[] {
  const digits = onlyCepDigits(customerCep);
  if (digits.length !== 8) return [...stores];
  return [...stores]
    .map((s) => ({
      ...s,
      distanceKm: estimateCepDistanceKm(customerCep, s.cep),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

export function findNearestStore(
  stores: LoslosStore[],
  customerCep: string,
): LoslosStore | null {
  const ranked = rankStoresByCep(stores, customerCep);
  return ranked[0] ?? null;
}

export function storeDirectionsUrl(store: LoslosStore): string {
  const destination = encodeURIComponent(
    `${store.address}, ${store.city} - ${store.uf}, ${formatCepDisplay(store.cep)}, Brasil`,
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function resolveCustomerCep(
  orderCep?: string,
  checkoutCep?: string,
): string {
  const fromOrder = onlyCepDigits(orderCep ?? "");
  if (fromOrder.length === 8) return fromOrder;
  const fromCheckout = onlyCepDigits(checkoutCep ?? "");
  if (fromCheckout.length === 8) return fromCheckout;
  return "";
}
