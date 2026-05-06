import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./auth-token";
import { commerceUsesDatabase } from "./commerce-backend";
import { serverApiUrl } from "./server-api-url";

export type PlatformMe = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  stripeOnboardingComplete: boolean;
  hasStripeAccount: boolean;
  supplierProfile: {
    businessName: string;
    cep: string;
    phone: string;
    addressLine1: string;
    addressComplement: string | null;
    city: string;
    stateUf: string;
  } | null;
  executorProfile: {
    displayName: string;
    cep: string;
    phone: string;
    addressLine1: string;
    addressComplement: string | null;
    city: string;
    stateUf: string;
  } | null;
};

export type StoreOrderLineDto = {
  id?: string;
  listing_id: string;
  product_slug: string;
  product_name: string;
  quantity: number;
  unit_price_brl: number;
  composite_product_id: string;
  /** ISO 8601 quando a peça foi postada ao cliente. */
  posted_at?: string | null;
  tracking_code?: string | null;
  carrier_name?: string | null;
};

export type StoreCustomerOrderDto = {
  id: string;
  created_at: string;
  channel: string;
  stripe_session_id: string | null;
  total_brl: number | null;
  delivery: unknown;
  lines: StoreOrderLineDto[];
};

export async function fetchCustomerStoreOrders(): Promise<StoreCustomerOrderDto[] | null> {
  if (!commerceUsesDatabase()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${serverApiUrl()}/accounts/me/store-orders`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return [];
    if (!res.ok) return null;
    return (await res.json()) as StoreCustomerOrderDto[];
  } catch {
    return null;
  }
}

export async function fetchPlatformMe(): Promise<PlatformMe | null> {
  if (!commerceUsesDatabase()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${serverApiUrl()}/accounts/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PlatformMe;
  } catch {
    return null;
  }
}

export async function fetchSupplyItemsForSession(): Promise<import("./demo-seed").DemoSupplyItem[] | null> {
  if (!commerceUsesDatabase()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${serverApiUrl()}/supply-items`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return [];
    }
    if (!res.ok) return null;
    return (await res.json()) as import("./demo-seed").DemoSupplyItem[];
  } catch {
    return null;
  }
}

export type SupplierFulfillmentLineDto = {
  id: string;
  production_assignment_id: string;
  supply_item_id: string;
  composite_product_id: string;
  product_nome: string;
  quantidade_por_peca: number;
  executor_nome: string;
  executor_email: string;
  executor_cep: string;
  executor_cidade: string;
  executor_endereco: string;
  melhor_envio_etiqueta_url: string | null;
  melhor_envio_pedido_id: string | null;
  envio_pacote_altura_cm: number | null;
  envio_pacote_largura_cm: number | null;
  envio_pacote_comprimento_cm: number | null;
  envio_pacote_peso_kg: number | null;
  frete_cotado_reais: number | null;
  insumo: {
    nome: string;
    sku_interno: string;
    quantidade_kind: string;
    quantidade: number;
    imagem_url: string | null;
    pacote_altura_cm?: number;
    pacote_largura_cm?: number;
    pacote_comprimento_cm?: number;
    pacote_peso_kg?: number;
  };
};

export async function fetchSupplierFulfillmentForSession(): Promise<SupplierFulfillmentLineDto[] | null> {
  if (!commerceUsesDatabase()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${serverApiUrl()}/supply-items/fulfillment-lines`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return [];
    if (!res.ok) return null;
    return (await res.json()) as SupplierFulfillmentLineDto[];
  } catch {
    return null;
  }
}
