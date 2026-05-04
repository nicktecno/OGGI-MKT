import type { DemoSupplyItem } from "./demo-seed";
import { serverApiConfigured, serverApiUrl } from "./server-api-url";

/** Insumos ativos no banco (via API interna) para resolver linhas dos produtos compostos. */
export async function fetchSupplyCatalogFromApi(): Promise<DemoSupplyItem[]> {
  if (!serverApiConfigured()) return [];
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  const res = await fetch(`${serverApiUrl()}/internal/platform/catalog/supply-items`, {
    headers: { "x-internal-secret": secret },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as DemoSupplyItem[];
}
