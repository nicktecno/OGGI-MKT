import type { Metric } from "web-vitals";

export const GA_MEASUREMENT_ID =
  typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "") : "";

/** Em produção envia sempre que houver ID. Em dev só se `NEXT_PUBLIC_ANALYTICS_DEBUG=true`. */
export function isAnalyticsEnabled(): boolean {
  if (!GA_MEASUREMENT_ID) return false;
  if (process.env.NODE_ENV !== "production") {
    return process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";
  }
  return true;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function getGtag(): ((...args: unknown[]) => void) | undefined {
  if (typeof window === "undefined") return undefined;
  return window.gtag;
}

export function trackPageView(pathWithQuery: string) {
  if (!isAnalyticsEnabled() || !GA_MEASUREMENT_ID) return;
  const g = getGtag();
  if (!g) return;
  const page_path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  g("config", GA_MEASUREMENT_ID, { page_path });
}

export type GaItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!isAnalyticsEnabled()) return;
  const g = getGtag();
  if (!g) return;
  g("event", name, params ?? {});
}

export function trackViewItem(item: GaItem & { currency?: string; value?: number }) {
  trackEvent("view_item", {
    currency: item.currency ?? "BRL",
    value: item.value ?? item.price,
    items: [
      {
        item_id: item.item_id,
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity ?? 1,
      },
    ],
  });
}

export function trackAddToCart(params: {
  listingId: string;
  productName: string;
  productSlug: string;
  price: number;
  quantity: number;
}) {
  trackEvent("add_to_cart", {
    currency: "BRL",
    value: Math.round(params.price * params.quantity * 100) / 100,
    items: [
      {
        item_id: params.listingId,
        item_name: params.productName,
        item_list_id: params.productSlug,
        price: params.price,
        quantity: params.quantity,
      },
    ],
  });
}

export function trackBeginCheckout(params: { value: number; items: GaItem[] }) {
  trackEvent("begin_checkout", {
    currency: "BRL",
    value: params.value,
    items: params.items.map((i) => ({
      item_id: i.item_id,
      item_name: i.item_name,
      price: i.price,
      quantity: i.quantity ?? 1,
    })),
  });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  currency?: string;
}) {
  trackEvent("purchase", {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency ?? "BRL",
  });
}

export function trackGenerateLead(params?: { method?: string }) {
  trackEvent("generate_lead", { method: params?.method ?? "contact_form" });
}

export function trackLogin(params?: { method?: string }) {
  trackEvent("login", { method: params?.method ?? "email" });
}

export function trackSignUp(params?: { method?: string; role?: string }) {
  trackEvent("sign_up", {
    method: params?.method ?? "email",
    ...(params?.role ? { role: params.role } : {}),
  });
}

export function trackSearch(search_term: string) {
  const q = search_term.trim();
  if (!q) return;
  trackEvent("search", { search_term: q });
}

export function reportWebVital(metric: Metric) {
  if (!isAnalyticsEnabled()) return;
  const g = getGtag();
  if (!g) return;
  const value =
    metric.name === "CLS" ? Math.round(metric.value * 1000) : Math.round(metric.value);
  g("event", "web_vitals", {
    metric_name: metric.name,
    value,
    metric_id: metric.id,
    metric_rating: metric.rating,
    non_interaction: true,
  });
}
