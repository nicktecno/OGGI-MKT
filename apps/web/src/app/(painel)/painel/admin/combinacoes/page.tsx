import type { Metadata } from "next";
import { commerceUsesDatabase, getDemoCommerceState } from "@/lib/demo-runtime";
import { executorOptionsFromDemoCommerce } from "@/lib/demo-seed";
import { fetchActiveExecutorPickerOptions } from "@/lib/platform-internal";
import { CombinacoesSectionClient } from "../admin-section-clients";

export const metadata: Metadata = {
  title: "Quem faz o quê",
};

export default async function AdminCombinacoesPage() {
  const state = await getDemoCommerceState();
  const executorOptions = commerceUsesDatabase()
    ? await fetchActiveExecutorPickerOptions()
    : executorOptionsFromDemoCommerce(state);
  return (
    <CombinacoesSectionClient
      products={state.products}
      productionAssignments={state.productionAssignments}
      executorOptions={executorOptions}
    />
  );
}
