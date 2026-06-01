"use server";

import { revalidatePath } from "next/cache";
import {
  getCommerceState,
  persistCreateExecutionRequest,
  persistExecutorPublishAssignment,
} from "@/lib/commerce-backend";
import { revalidateStorefrontCache } from "@/lib/storefront-cache";
import { getSession } from "@/lib/session";

export async function solicitarProducaoAction(compositeProductId: string) {
  const session = await getSession();
  if (!session || session.role !== "EXECUTOR") {
    throw new Error("Apenas costureiras autenticadas podem solicitar produção.");
  }
  const nome = session.name?.trim() || session.email;
  await persistCreateExecutionRequest({
    compositeProductId,
    executorEmail: session.email,
    executorNome: nome,
  });
  revalidatePath("/painel/executor");
  revalidatePath("/painel/admin/pedidos");
  revalidatePath("/painel", "layout");
}

export async function liberarOfertaVitrineAction(assignmentId: string, availableQuantity: number) {
  const session = await getSession();
  if (!session || session.role !== "EXECUTOR") {
    throw new Error("Apenas costureiras autenticadas podem liberar ofertas na vitrine.");
  }
  const state = await getCommerceState();
  const a = state.productionAssignments.find((x) => x.id === assignmentId);
  if (!a) throw new Error("Não encontramos esta atribuição.");
  if (a.executorEmail.toLowerCase() !== session.email.toLowerCase()) {
    throw new Error("Esta atribuição não está ligada à sua conta.");
  }
  const qty = Number(availableQuantity);
  if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1) {
    throw new Error("Informe uma quantidade inteira à venda de pelo menos 1.");
  }
  await persistExecutorPublishAssignment(assignmentId, qty);
  const product = state.products.find((p) => p.id === a.compositeProductId);
  revalidateStorefrontCache(product?.slug);
  revalidatePath("/painel/executor");
  revalidatePath("/painel/admin/combinacoes");
}
