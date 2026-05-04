import type { Metadata } from "next";
import { getDemoCommerceState } from "@/lib/demo-runtime";
import { fetchSupplyCatalogFromApi } from "@/lib/supply-catalog";
import { PecasSectionClient } from "../admin-section-clients";

export const metadata: Metadata = {
  title: "Peças e preços",
};

export default async function AdminPecasPage() {
  const state = await getDemoCommerceState();
  const supplyCatalogExtra = await fetchSupplyCatalogFromApi();
  return (
    <PecasSectionClient products={state.products} supplyCatalogExtra={supplyCatalogExtra} />
  );
}
