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

export async function fetchPlatformMe(): Promise<PlatformMe | null> {
  if (!commerceUsesDatabase()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const res = await fetch(`${serverApiUrl()}/accounts/me`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as PlatformMe;
}

export async function fetchSupplyItemsForSession(): Promise<import("./demo-seed").DemoSupplyItem[] | null> {
  if (!commerceUsesDatabase()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const res = await fetch(`${serverApiUrl()}/supply-items`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) {
    return [];
  }
  if (!res.ok) return null;
  return (await res.json()) as import("./demo-seed").DemoSupplyItem[];
}
