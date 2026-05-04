import type { Metadata } from "next";
import { getDemoCommerceState } from "@/lib/demo-runtime";
import { PedidosSectionClient } from "../admin-section-clients";

export const metadata: Metadata = {
  title: "Pedidos das costureiras",
};

export default async function AdminPedidosPage() {
  const state = await getDemoCommerceState();
  return (
    <PedidosSectionClient products={state.products} executionRequests={state.executionRequests} />
  );
}
