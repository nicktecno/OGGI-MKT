import type { DemoCommerceState } from "./commerce-cookies";
import type { DemoExecutionRequest, DemoProductionAssignment } from "./demo-seed";
import { getCommerceStateFromCookies, updateCommerceDelta } from "./commerce-cookies";
import { serverApiConfigured, serverApiUrl } from "./server-api-url";

function internalSecret(): string {
  return process.env.INTERNAL_API_SECRET ?? "";
}

export function commerceUsesDatabase(): boolean {
  return serverApiConfigured();
}

async function internalFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = serverApiUrl();
  if (!base.trim()) {
    throw new Error(
      "Defina COMMERCE_API_URL ou SERVER_API_URL no ambiente do Next (ex.: http://localhost:4000).",
    );
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const isFormData = init?.body instanceof FormData;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(isFormData ? {} : { "content-type": "application/json" }),
        ...(init?.headers as Record<string, string>),
        "x-internal-secret": internalSecret(),
      },
      cache: "no-store",
    });
    return res;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Ligação à API falhou (${base}). Confirme que o Nest está a correr na mesma URL e que INTERNAL_API_SECRET coincide com a API. Detalhe: ${detail}`,
    );
  }
}

async function readApiError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: string | string[] };
    if (typeof j.message === "string") return j.message;
    if (Array.isArray(j.message)) return j.message.join(", ");
  } catch {
    /* ignore */
  }
  return (await res.text()) || `Erro HTTP ${res.status}`;
}

export async function getCommerceState(): Promise<DemoCommerceState> {
  if (commerceUsesDatabase()) {
    const res = await internalFetch("/internal/commerce/state");
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    return (await res.json()) as DemoCommerceState;
  }
  return getCommerceStateFromCookies();
}

export const getDemoCommerceState = getCommerceState;

export async function persistSetProductAdminPaused(productId: string, adminPausado: boolean) {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(`/internal/commerce/products/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      body: JSON.stringify({ admin_pausado: adminPausado }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  await updateCommerceDelta((d) => ({
    ...d,
    productPatch: {
      ...d.productPatch,
      [productId]: { ...d.productPatch?.[productId], admin_pausado: adminPausado },
    },
  }));
}

export async function persistSetProductActive(productId: string, ativo: boolean) {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(`/internal/commerce/products/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      body: JSON.stringify({ ativo }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  await updateCommerceDelta((d) => ({
    ...d,
    productPatch: {
      ...d.productPatch,
      [productId]: { ...d.productPatch?.[productId], ativo },
    },
  }));
}

export async function persistCompositeProductPricing(input: {
  productId: string;
  preco_venda_publico: number;
  executor_fee_planejada: number;
  platform_fee_planejada: number;
  pacote_altura_cm: number;
  pacote_largura_cm: number;
  pacote_comprimento_cm: number;
  pacote_peso_kg: number;
}) {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(
      `/internal/commerce/products/${encodeURIComponent(input.productId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          preco_venda_publico: input.preco_venda_publico,
          executor_fee_planejada: input.executor_fee_planejada,
          platform_fee_planejada: input.platform_fee_planejada,
          pacote_altura_cm: input.pacote_altura_cm,
          pacote_largura_cm: input.pacote_largura_cm,
          pacote_comprimento_cm: input.pacote_comprimento_cm,
          pacote_peso_kg: input.pacote_peso_kg,
        }),
      },
    );
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  await updateCommerceDelta((d) => ({
    ...d,
    productPatch: {
      ...d.productPatch,
      [input.productId]: {
        ...d.productPatch?.[input.productId],
        preco_venda_publico: input.preco_venda_publico,
        executor_fee_planejada: input.executor_fee_planejada,
        platform_fee_planejada: input.platform_fee_planejada,
        pacote_altura_cm: input.pacote_altura_cm,
        pacote_largura_cm: input.pacote_largura_cm,
        pacote_comprimento_cm: input.pacote_comprimento_cm,
        pacote_peso_kg: input.pacote_peso_kg,
      },
    },
  }));
}

export async function persistApproveExecutionRequest(requestId: string) {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(
      `/internal/commerce/execution-requests/${encodeURIComponent(requestId)}/approve`,
      { method: "POST" },
    );
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  const req = state.executionRequests.find((r) => r.id === requestId);
  if (!req || req.status !== "PENDING") {
    throw new Error("Este pedido não está mais pendente ou já foi respondido.");
  }
  if (
    state.productionAssignments.some(
      (a) =>
        a.compositeProductId === req.compositeProductId &&
        a.executorEmail.toLowerCase() === req.executorEmail.toLowerCase() &&
        a.status !== "ARCHIVED",
    )
  ) {
    throw new Error("Já existe uma combinação ativa entre esta peça e esta costureira.");
  }
  const now = new Date().toISOString();
  const nextRequests: DemoExecutionRequest[] = state.executionRequests.map((r) =>
    r.id === requestId ? { ...r, status: "APPROVED" as const, reviewed_at: now } : r,
  );
  const assignment: DemoProductionAssignment = {
    id: `asg-${crypto.randomUUID().slice(0, 8)}`,
    compositeProductId: req.compositeProductId,
    executorEmail: req.executorEmail,
    executorNome: req.executorNome.includes("Atelier")
      ? req.executorNome
      : `${req.executorNome} — Atelier`,
    cidade_origem: "São Paulo — SP",
    cep_origem: "01310-100",
    available_quantity: 0,
    units_produced: 0,
    status: "ASSIGNED",
    assignment_source: "REQUEST_APPROVED",
    execution_request_id: req.id,
  };
  await updateCommerceDelta((d) => ({
    ...d,
    executionRequests: nextRequests,
    assignments: [...state.productionAssignments, assignment],
  }));
}

export async function persistCreateExecutionRequest(input: {
  compositeProductId: string;
  executorEmail: string;
  executorNome: string;
}) {
  const email = input.executorEmail.trim().toLowerCase();
  const nome = input.executorNome.trim();
  if (!email || !nome) {
    throw new Error("Sessão inválida para solicitar produção.");
  }
  if (commerceUsesDatabase()) {
    const res = await internalFetch("/internal/commerce/execution-requests", {
      method: "POST",
      body: JSON.stringify({
        compositeProductId: input.compositeProductId,
        executorEmail: email,
        executorNome: nome,
      }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  if (!state.products.some((p) => p.id === input.compositeProductId)) {
    throw new Error("Peça não encontrada.");
  }
  const pendingDup = state.executionRequests.some(
    (r) =>
      r.compositeProductId === input.compositeProductId &&
      r.executorEmail.toLowerCase() === email &&
      r.status === "PENDING",
  );
  if (pendingDup) {
    throw new Error("Já existe um pedido pendente para esta peça.");
  }
  const newReq: DemoExecutionRequest = {
    id: `req-${crypto.randomUUID().slice(0, 10)}`,
    compositeProductId: input.compositeProductId,
    executorEmail: email,
    executorNome: nome,
    status: "PENDING",
  };
  await updateCommerceDelta((d) => ({
    ...d,
    executionRequests: [...state.executionRequests, newReq],
  }));
}

export async function persistRejectExecutionRequest(requestId: string, rejectionReason: string) {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(
      `/internal/commerce/execution-requests/${encodeURIComponent(requestId)}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      },
    );
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  const req = state.executionRequests.find((r) => r.id === requestId);
  if (!req || req.status !== "PENDING") {
    throw new Error("Este pedido não está mais pendente ou já foi respondido.");
  }
  const now = new Date().toISOString();
  const nextRequests: DemoExecutionRequest[] = state.executionRequests.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: "REJECTED" as const,
          reviewed_at: now,
          rejection_reason: rejectionReason.trim() || "(sem motivo informado)",
        }
      : r,
  );
  await updateCommerceDelta((d) => ({
    ...d,
    executionRequests: nextRequests,
  }));
}

export async function persistCreateDirectAssignment(input: {
  compositeProductId: string;
  executorEmail: string;
  executorNome: string;
  cidade_origem: string;
  cep_origem: string;
}) {
  if (commerceUsesDatabase()) {
    const res = await internalFetch("/internal/commerce/assignments", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const email = input.executorEmail.trim().toLowerCase();
  const nome = input.executorNome.trim();
  if (!email || !nome || !input.cidade_origem.trim() || !input.cep_origem.trim()) {
    throw new Error("Preencha e-mail, nome, cidade e CEP.");
  }
  const state = await getCommerceStateFromCookies();
  if (!state.products.some((p) => p.id === input.compositeProductId)) {
    throw new Error("Peça não encontrada.");
  }
  if (
    state.productionAssignments.some(
      (a) =>
        a.compositeProductId === input.compositeProductId &&
        a.executorEmail.toLowerCase() === email &&
        a.status !== "ARCHIVED",
    )
  ) {
    throw new Error("Já existe uma combinação ativa entre esta peça e esta costureira.");
  }
  const assignment: DemoProductionAssignment = {
    id: `asg-${crypto.randomUUID().slice(0, 8)}`,
    compositeProductId: input.compositeProductId,
    executorEmail: email,
    executorNome: nome,
    cidade_origem: input.cidade_origem.trim(),
    cep_origem: input.cep_origem.trim(),
    available_quantity: 0,
    units_produced: 0,
    status: "ASSIGNED",
    assignment_source: "ADMIN_DIRECT",
    execution_request_id: null,
  };
  await updateCommerceDelta((d) => ({
    ...d,
    assignments: [...state.productionAssignments, assignment],
  }));
}

export async function persistArchiveAssignment(assignmentId: string) {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(
      `/internal/commerce/assignments/${encodeURIComponent(assignmentId)}/archive`,
      { method: "POST" },
    );
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  if (!state.productionAssignments.some((a) => a.id === assignmentId)) {
    throw new Error("Não encontramos essa combinação.");
  }
  const next = state.productionAssignments.map((a) =>
    a.id === assignmentId ? { ...a, status: "ARCHIVED" as const } : a,
  );
  await updateCommerceDelta((d) => ({
    ...d,
    assignments: next,
  }));
}

/** Publica oferta na vitrine (costureira); cookie ou API interna. */
export async function persistExecutorPublishAssignment(
  assignmentId: string,
  availableQuantity: number,
) {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(
      `/internal/commerce/assignments/${encodeURIComponent(assignmentId)}/publish`,
      {
        method: "POST",
        body: JSON.stringify({ available_quantity: availableQuantity }),
      },
    );
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  const idx = state.productionAssignments.findIndex((a) => a.id === assignmentId);
  if (idx === -1) throw new Error("Não encontramos essa combinação.");
  const a = state.productionAssignments[idx];
  if (a.status === "ARCHIVED") {
    throw new Error("Esta combinação foi encerrada.");
  }
  if (a.status === "PUBLISHED") {
    throw new Error("Esta oferta já está publicada na loja.");
  }
  if (!Number.isInteger(availableQuantity) || availableQuantity < 1) {
    throw new Error("Use uma quantidade inteira maior ou igual a 1.");
  }
  const nextUnits = Math.max(a.units_produced, availableQuantity);
  const nextAssignments = state.productionAssignments.map((row, i) =>
    i === idx
      ? {
          ...row,
          status: "PUBLISHED" as const,
          available_quantity: availableQuantity,
          units_produced: nextUnits,
        }
      : row,
  );
  await updateCommerceDelta((d) => ({
    ...d,
    assignments: nextAssignments,
  }));
}

/** Envia WebP da vitrine para a API (Cloudflare R2) e grava URL na peça. Só com base de dados + R2 configurados. */
export async function persistProductMarketplaceImage(
  productId: string,
  formData: FormData,
): Promise<string> {
  if (!commerceUsesDatabase()) {
    throw new Error(
      "Alterar fotos da vitrine exige API Nest com armazenamento Cloudflare R2 configurado (variáveis R2_* na API).",
    );
  }
  const res = await internalFetch(
    `/internal/commerce/products/${encodeURIComponent(productId)}/image`,
    { method: "POST", body: formData },
  );
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { url?: string };
  if (!data.url?.trim()) throw new Error("Resposta da API sem URL da imagem.");
  return data.url.trim();
}
