"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { DEMO_COMPOSITE_PRODUCTS } from "@/lib/demo-seed";
import {
  persistApproveExecutionRequest,
  persistArchiveAssignment,
  persistCompositeProductPricing,
  persistCreateDirectAssignment,
  persistProductMarketplaceImage,
  persistRejectExecutionRequest,
  persistSetProductActive,
  persistSetProductAdminPaused,
} from "@/lib/demo-runtime";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Só quem administra a loja pode fazer esta ação.");
  }
  return session;
}

function revalidateStorefront() {
  revalidatePath("/loja");
  revalidatePath("/painel/admin", "layout");
  revalidatePath("/painel/executor");
  for (const p of DEMO_COMPOSITE_PRODUCTS) {
    revalidatePath(`/loja/produto/${p.slug}`);
  }
}

export async function setProductAdminPaused(productId: string, adminPausado: boolean) {
  await requireAdmin();
  await persistSetProductAdminPaused(productId, adminPausado);
  revalidateStorefront();
}

export async function setProductActive(productId: string, ativo: boolean) {
  await requireAdmin();
  await persistSetProductActive(productId, ativo);
  revalidateStorefront();
}

export async function updateCompositeProductPricing(input: {
  productId: string;
  preco_venda_publico: number;
  executor_fee_planejada: number;
  platform_fee_planejada: number;
}) {
  await requireAdmin();
  const { productId, preco_venda_publico, executor_fee_planejada, platform_fee_planejada } =
    input;
  if (
    !Number.isFinite(preco_venda_publico) ||
    !Number.isFinite(executor_fee_planejada) ||
    !Number.isFinite(platform_fee_planejada) ||
    preco_venda_publico < 0 ||
    executor_fee_planejada < 0 ||
    platform_fee_planejada < 0
  ) {
    throw new Error("Confira os números: use valores em reais, zero ou maiores.");
  }
  await persistCompositeProductPricing({
    productId,
    preco_venda_publico,
    executor_fee_planejada,
    platform_fee_planejada,
  });
  revalidateStorefront();
}

export async function approveExecutionRequest(requestId: string) {
  await requireAdmin();
  await persistApproveExecutionRequest(requestId);
  revalidateStorefront();
}

export async function rejectExecutionRequest(requestId: string, rejectionReason: string) {
  await requireAdmin();
  await persistRejectExecutionRequest(requestId, rejectionReason);
  revalidateStorefront();
}

export async function createDirectAssignment(input: {
  compositeProductId: string;
  executorEmail: string;
  executorNome: string;
  cidade_origem: string;
  cep_origem: string;
}) {
  await requireAdmin();
  await persistCreateDirectAssignment(input);
  revalidateStorefront();
}

export async function archiveProductionAssignment(assignmentId: string) {
  await requireAdmin();
  await persistArchiveAssignment(assignmentId);
  revalidateStorefront();
}

export async function uploadMarketplaceProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Nenhum ficheiro recebido.");
  }
  await persistProductMarketplaceImage(productId, formData);
  revalidateStorefront();
}
