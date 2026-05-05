"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { DEMO_COMPOSITE_PRODUCTS } from "@/lib/demo-seed";
import {
  persistApproveExecutionRequest,
  persistArchiveAssignment,
  persistAssignmentStorefrontHighlight,
  persistCompositeProductPricing,
  persistCreateCompositeProduct,
  persistCreateDirectAssignment,
  persistDeleteCompositeProduct,
  persistProductGalleryImage,
  persistProductMarketplaceImage,
  persistRejectExecutionRequest,
  persistRemoveProductGalleryImage,
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

/** Evita 500 na Server Action se a invalidação de cache falhar (ex.: pressão no edge). */
function safeRevalidatePath(path: string, type?: "layout" | "page") {
  try {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  } catch (e) {
    console.error("[admin actions] revalidatePath:", path, e);
  }
}

function revalidateStorefront() {
  safeRevalidatePath("/");
  safeRevalidatePath("/loja");
  safeRevalidatePath("/painel/admin", "layout");
  safeRevalidatePath("/painel/executor");
  for (const p of DEMO_COMPOSITE_PRODUCTS) {
    safeRevalidatePath(`/loja/produto/${p.slug}`);
  }
}

function revalidateProductPage(slug: string) {
  safeRevalidatePath(`/loja/produto/${slug}`);
}

export async function createCompositeProductAction(
  input: {
    nome: string;
    slug?: string;
    sku: string;
    descricao_curta: string;
    linhas: { supply_item_id: string; quantidade: number }[];
    variacoes_tamanho: string[];
    preco_venda_publico?: number;
    executor_fee_planejada?: number;
    platform_fee_planejada?: number;
  },
  /** Capa da vitrine: enviada no mesmo pedido à API para evitar placeholder na listagem. */
  coverFile?: File,
) {
  await requireAdmin();
  const result = await persistCreateCompositeProduct(
    input,
    coverFile && coverFile.size > 0 ? coverFile : undefined,
  );
  safeRevalidatePath(`/loja/produto/${result.slug}`);
  safeRevalidatePath("/loja");
  safeRevalidatePath("/painel/admin", "layout");
  safeRevalidatePath("/painel/executor");
  return result;
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
  pacote_altura_cm: number;
  pacote_largura_cm: number;
  pacote_comprimento_cm: number;
  pacote_peso_kg: number;
}) {
  await requireAdmin();
  const {
    productId,
    preco_venda_publico,
    executor_fee_planejada,
    platform_fee_planejada,
    pacote_altura_cm,
    pacote_largura_cm,
    pacote_comprimento_cm,
    pacote_peso_kg,
  } = input;
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
  if (
    !Number.isFinite(pacote_altura_cm) ||
    !Number.isFinite(pacote_largura_cm) ||
    !Number.isFinite(pacote_comprimento_cm) ||
    !Number.isFinite(pacote_peso_kg) ||
    pacote_altura_cm < 0.1 ||
    pacote_largura_cm < 0.1 ||
    pacote_comprimento_cm < 0.1 ||
    pacote_peso_kg < 0.01
  ) {
    throw new Error("Pacote: use dimensões ≥ 0,1 cm e peso ≥ 0,01 kg.");
  }
  await persistCompositeProductPricing({
    productId,
    preco_venda_publico,
    executor_fee_planejada,
    platform_fee_planejada,
    pacote_altura_cm,
    pacote_largura_cm,
    pacote_comprimento_cm,
    pacote_peso_kg,
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

export async function setAssignmentStorefrontHighlightOrderAction(
  assignmentId: string,
  order: number | null,
) {
  await requireAdmin();
  await persistAssignmentStorefrontHighlight(assignmentId, order);
  revalidateStorefront();
}

export async function uploadMarketplaceProductImage(
  productId: string,
  formData: FormData,
  productSlug?: string,
) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Nenhum ficheiro recebido.");
  }
  await persistProductMarketplaceImage(productId, formData);
  revalidateStorefront();
  if (productSlug) revalidateProductPage(productSlug);
}

export async function uploadMarketplaceProductGalleryImage(
  productId: string,
  productSlug: string,
  formData: FormData,
) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Nenhum ficheiro recebido.");
  }
  await persistProductGalleryImage(productId, formData);
  revalidateStorefront();
  revalidateProductPage(productSlug);
}

export async function removeMarketplaceProductGalleryImageAction(
  productId: string,
  productSlug: string,
  imageUrl: string,
) {
  await requireAdmin();
  await persistRemoveProductGalleryImage(productId, imageUrl);
  revalidateStorefront();
  revalidateProductPage(productSlug);
}

export async function deleteCompositeProductAction(productId: string, productSlug: string) {
  await requireAdmin();
  await persistDeleteCompositeProduct(productId);
  revalidateStorefront();
  revalidateProductPage(productSlug);
}
