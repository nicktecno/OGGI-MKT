import type { DemoCommerceState } from "./commerce-cookies";
import type {
  DemoCompositeLine,
  DemoCompositeProduct,
  DemoExecutionRequest,
  DemoProductionAssignment,
} from "./demo-seed";
import {
  DEMO_ASSIGNMENTS_INITIAL,
  DEMO_COMPOSITE_PRODUCTS,
  DEMO_EXECUTION_REQUESTS_INITIAL,
  compositeInsumosTotal,
  compositePrecoFromLinhasAndFees,
  demoFreteB2BForCompositeProduct,
  getSupplyItemById,
  insumoCostTotal,
} from "./demo-seed";
import { getCommerceStateFromCookies, updateCommerceDelta } from "./commerce-cookies";
import { normalizeVariacoesTamanho } from "./product-sizes";
import { serverApiConfigured, serverApiUrl } from "./server-api-url";

function internalSecret(): string {
  return process.env.INTERNAL_API_SECRET ?? "";
}

export function commerceUsesDatabase(): boolean {
  return serverApiConfigured();
}

export async function internalFetch(path: string, init?: RequestInit): Promise<Response> {
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
      `A conexão com a API falhou (${base}). Confirme se o Nest está rodando na mesma URL e se INTERNAL_API_SECRET coincide com o da API. Detalhe: ${detail}`,
    );
  }
}

/** Cota frete B2C (público, sem segredo interno). Só quando `COMMERCE_API_URL` está definido. */
export async function fetchCheckoutShippingQuotePublic(
  cepDestino: string,
  lines: { listing_id: string; quantity: number }[],
): Promise<{ total_frete_brl: number; lines: { listing_id: string; frete_brl: number }[] }> {
  const base = serverApiUrl().trim().replace(/\/$/, "");
  if (!base) {
    throw new Error("Defina COMMERCE_API_URL para cotar o frete.");
  }
  const cep = cepDestino.replace(/\D/g, "").slice(0, 8);
  const res = await fetch(`${base}/public/commerce/shipping-quote`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cep_destino: cep, lines }),
    cache: "no-store",
  });
  const text = await res.text();
  let json: { total_frete_brl?: number; lines?: { listing_id: string; frete_brl: number }[]; message?: string | string[] };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(text || `Erro ${res.status}`);
  }
  if (!res.ok) {
    const m = json.message;
    const msg =
      typeof m === "string" ? m : Array.isArray(m) ? m.join(", ") : text || `Erro ${res.status}`;
    throw new Error(msg);
  }
  if (typeof json.total_frete_brl !== "number" || !Array.isArray(json.lines)) {
    throw new Error("Resposta de cotação inválida.");
  }
  return { total_frete_brl: json.total_frete_brl, lines: json.lines };
}

export async function readApiError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { message?: string | string[] };
    if (typeof j.message === "string") return j.message;
    if (Array.isArray(j.message)) return j.message.join(", ");
  } catch {
    /* ignore */
  }
  return (await res.text()) || `Erro HTTP ${res.status}`;
}

function coerceFiniteNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/** Garante formato esperado pelo app após `JSON.parse` da API (Prisma/JSON heterogéneo). */
function normalizeCompositeLineRow(row: unknown): DemoCompositeLine | null {
  if (typeof row !== "object" || row === null) return null;
  const r = row as Record<string, unknown>;
  const sidRaw = r.supplyItemId ?? r.supply_item_id;
  const sid = typeof sidRaw === "string" ? sidRaw.trim() : "";
  const qRaw = r.quantidade;
  const q = typeof qRaw === "number" ? qRaw : Number(qRaw);
  const cRaw = r.snapshot_custo_unitario;
  const c = typeof cRaw === "number" ? cRaw : Number(cRaw);
  if (!sid || !Number.isFinite(q) || q <= 0) return null;
  const cost = Number.isFinite(c) && c >= 0 ? c : 0;
  return { supplyItemId: sid, quantidade: q, snapshot_custo_unitario: cost };
}

const PLACEHOLDER_VITRINE =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=88";

/** Aceita array, JSON em string ou valores inválidos — sempre devolve array de linhas. */
function parseLinhasFromApiJson(raw: unknown): DemoCompositeLine[] {
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const out: DemoCompositeLine[] = [];
  for (const row of arr) {
    const line = normalizeCompositeLineRow(row);
    if (line) out.push(line);
  }
  return out;
}

function normalizeProductFromApi(p: DemoCompositeProduct): DemoCompositeProduct {
  const linhas = parseLinhasFromApiJson(p.linhas as unknown);
  const galleryRaw = p.galeria_imagens as unknown;
  const galeria_imagens = Array.isArray(galleryRaw)
    ? galleryRaw
        .filter((u): u is string => typeof u === "string")
        .map((u) => u.trim())
        .filter(Boolean)
    : [];

  const imagem =
    typeof p.imagem_url === "string" && p.imagem_url.trim().length > 0 ? p.imagem_url.trim() : PLACEHOLDER_VITRINE;

  return {
    ...p,
    linhas,
    imagem_url: imagem,
    galeria_imagens,
    preco_venda_publico: coerceFiniteNumber(p.preco_venda_publico, 0),
    executor_fee_planejada: coerceFiniteNumber(p.executor_fee_planejada, 0),
    platform_fee_planejada: coerceFiniteNumber(p.platform_fee_planejada, 0),
    frete_insumos_atribuicao_reais:
      p.frete_insumos_atribuicao_reais === null || p.frete_insumos_atribuicao_reais === undefined
        ? (p.frete_insumos_atribuicao_reais ?? null)
        : coerceFiniteNumber(p.frete_insumos_atribuicao_reais, 0),
    pacote_altura_cm: coerceFiniteNumber(p.pacote_altura_cm, 22),
    pacote_largura_cm: coerceFiniteNumber(p.pacote_largura_cm, 18),
    pacote_comprimento_cm: coerceFiniteNumber(p.pacote_comprimento_cm, 8),
    pacote_peso_kg: coerceFiniteNumber(p.pacote_peso_kg, 0.55),
  };
}

function normalizeCommerceStateFromApi(state: DemoCommerceState): DemoCommerceState {
  const productsRaw = state.products as unknown;
  const products = Array.isArray(productsRaw)
    ? productsRaw
        .filter((p): p is DemoCompositeProduct => typeof p === "object" && p !== null && "id" in p)
        .map((p) => normalizeProductFromApi(p))
    : [];
  const execRaw = state.executionRequests as unknown;
  const executionRequests = Array.isArray(execRaw)
    ? execRaw
    : [];
  const assignRaw = state.productionAssignments as unknown;
  const productionAssignments = Array.isArray(assignRaw)
    ? assignRaw
    : [];
  return {
    ...state,
    products,
    executionRequests,
    productionAssignments,
  };
}

export type SupplierAccountOption = { id: string; email: string; label: string };

export async function fetchSupplierAccountsFromApi(): Promise<SupplierAccountOption[]> {
  if (!commerceUsesDatabase()) return [];
  const res = await internalFetch("/internal/platform/supplier-accounts");
  if (!res.ok) return [];
  return (await res.json()) as SupplierAccountOption[];
}

export async function getCommerceState(): Promise<DemoCommerceState> {
  if (commerceUsesDatabase()) {
    const res = await internalFetch("/internal/commerce/state");
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    let raw: DemoCommerceState;
    try {
      raw = (await res.json()) as DemoCommerceState;
    } catch (e) {
      console.error("[getCommerceState] JSON inválido da API:", e);
      throw new Error("Resposta inválida da API ao carregar o estado da loja.");
    }
    try {
      return normalizeCommerceStateFromApi(raw);
    } catch (e) {
      console.error("[getCommerceState] falha ao normalizar estado:", e);
      return {
        products: [],
        executionRequests: [],
        productionAssignments: [],
      };
    }
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
  executor_fee_planejada: number;
  platform_fee_planejada: number;
  pacote_altura_cm: number;
  pacote_largura_cm: number;
  pacote_comprimento_cm: number;
  pacote_peso_kg: number;
  /** Quando omitido, só dimensões/peso do pacote são enviados (ex.: preço já congelado na atribuição). */
  linhas?: { supply_item_id: string; quantidade: number; snapshot_custo_unitario: number }[];
}) {
  if (commerceUsesDatabase()) {
    const body: Record<string, unknown> = {
      pacote_altura_cm: input.pacote_altura_cm,
      pacote_largura_cm: input.pacote_largura_cm,
      pacote_comprimento_cm: input.pacote_comprimento_cm,
      pacote_peso_kg: input.pacote_peso_kg,
    };
    if (input.linhas !== undefined) {
      body.executor_fee_planejada = input.executor_fee_planejada;
      body.platform_fee_planejada = input.platform_fee_planejada;
      body.linhas = input.linhas;
    }
    const res = await internalFetch(`/internal/commerce/products/${encodeURIComponent(input.productId)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  const product = state.products.find((p) => p.id === input.productId);
  if (!product) throw new Error("Peça não encontrada.");
  if (input.linhas === undefined) {
    await updateCommerceDelta((d) => ({
      ...d,
      productPatch: {
        ...d.productPatch,
        [input.productId]: {
          ...d.productPatch?.[input.productId],
          pacote_altura_cm: input.pacote_altura_cm,
          pacote_largura_cm: input.pacote_largura_cm,
          pacote_comprimento_cm: input.pacote_comprimento_cm,
          pacote_peso_kg: input.pacote_peso_kg,
        },
      },
    }));
    return;
  }
  const nextLinhas = product.linhas.map((l, i) => {
    const row = input.linhas![i];
    if (!row || row.supply_item_id !== l.supplyItemId || row.quantidade !== l.quantidade) {
      throw new Error("Montagem inválida ao salvar preços.");
    }
    return {
      ...l,
      snapshot_custo_unitario: row.snapshot_custo_unitario,
    };
  });
  const frete = product.frete_insumos_atribuicao_reais ?? 0;
  const preco_venda_publico = compositePrecoFromLinhasAndFees(
    nextLinhas,
    input.executor_fee_planejada,
    input.platform_fee_planejada,
    frete,
  );
  await updateCommerceDelta((d) => ({
    ...d,
    productPatch: {
      ...d.productPatch,
      [input.productId]: {
        ...d.productPatch?.[input.productId],
        linhas: nextLinhas,
        preco_venda_publico,
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
  const product = state.products.find((p) => p.id === req.compositeProductId);
  await updateCommerceDelta((d) => {
    const patch = d.productPatch ?? {};
    let nextPatch = patch;
    if (product && !product.preco_venda_congelado) {
      const frete = demoFreteB2BForCompositeProduct(product);
      const materiais = compositeInsumosTotal(product);
      nextPatch = {
        ...patch,
        [product.id]: {
          ...patch[product.id],
          frete_insumos_atribuicao_reais: frete,
          preco_venda_congelado: true,
          preco_venda_publico:
            materiais + frete + product.executor_fee_planejada + product.platform_fee_planejada,
        },
      };
    }
    return {
      ...d,
      executionRequests: nextRequests,
      assignments: [...state.productionAssignments, assignment],
      productPatch: nextPatch,
    };
  });
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
  const product = state.products.find((p) => p.id === input.compositeProductId);
  const cep = input.cep_origem.trim();
  await updateCommerceDelta((d) => {
    const patch = d.productPatch ?? {};
    let nextPatch = patch;
    if (product && !product.preco_venda_congelado) {
      const frete = demoFreteB2BForCompositeProduct(product, {
        cepOrigem: cep,
        cepDestino: cep,
      });
      const materiais = compositeInsumosTotal(product);
      nextPatch = {
        ...patch,
        [product.id]: {
          ...patch[product.id],
          frete_insumos_atribuicao_reais: frete,
          preco_venda_congelado: true,
          preco_venda_publico:
            materiais + frete + product.executor_fee_planejada + product.platform_fee_planejada,
        },
      };
    }
    return {
      ...d,
      assignments: [...state.productionAssignments, assignment],
      productPatch: nextPatch,
    };
  });
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

/** Ordem no carrossel de destaque da loja (admin). */
export async function persistAssignmentStorefrontHighlight(
  assignmentId: string,
  storefrontHighlightOrder: number | null,
): Promise<void> {
  if (storefrontHighlightOrder !== null) {
    if (!Number.isInteger(storefrontHighlightOrder) || storefrontHighlightOrder < 0) {
      throw new Error("Ordem de destaque: use um inteiro ≥ 0 ou deixe vazio para remover.");
    }
  }
  if (commerceUsesDatabase()) {
    const res = await internalFetch(
      `/internal/commerce/assignments/${encodeURIComponent(assignmentId)}/storefront-highlight`,
      {
        method: "PATCH",
        body: JSON.stringify({ storefront_highlight_order: storefrontHighlightOrder }),
      },
    );
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  const idx = state.productionAssignments.findIndex((a) => a.id === assignmentId);
  if (idx === -1) throw new Error("Não encontramos essa combinação.");
  const nextAssignments = state.productionAssignments.map((row, i) =>
    i === idx
      ? {
          ...row,
          ...(storefrontHighlightOrder === null
            ? { storefront_highlight_order: undefined }
            : { storefront_highlight_order: storefrontHighlightOrder }),
        }
      : row,
  );
  await updateCommerceDelta((d) => ({
    ...d,
    assignments: nextAssignments,
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

/** Envia WebP da vitrine para a API (Cloudflare R2) e grava URL na peça. Só com banco de dados + R2 configurados. */
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

/** Adiciona imagem extra à galeria do produto (R2 + API). */
export async function persistProductGalleryImage(
  productId: string,
  formData: FormData,
): Promise<string> {
  if (!commerceUsesDatabase()) {
    throw new Error(
      "Galeria de fotos exige API Nest com Cloudflare R2 (variáveis R2_* na API), como a imagem de capa.",
    );
  }
  const res = await internalFetch(
    `/internal/commerce/products/${encodeURIComponent(productId)}/gallery-image`,
    { method: "POST", body: formData },
  );
  if (!res.ok) throw new Error(await readApiError(res));
  const data = (await res.json()) as { url?: string };
  if (!data.url?.trim()) throw new Error("Resposta da API sem URL da imagem.");
  return data.url.trim();
}

export async function persistRemoveProductGalleryImage(productId: string, imageUrl: string): Promise<void> {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(
      `/internal/commerce/products/${encodeURIComponent(productId)}/gallery-remove`,
      {
        method: "POST",
        body: JSON.stringify({ url: imageUrl.trim() }),
      },
    );
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  const product = state.products.find((p) => p.id === productId);
  if (!product) throw new Error("Peça não encontrada.");
  const u = imageUrl.trim();
  if (!u) throw new Error("URL inválida.");
  if (u === product.imagem_url.trim()) {
    throw new Error(
      "A foto de capa não pode ser removida por aqui — use “Substituir imagem da vitrine” ou remova uma foto extra.",
    );
  }
  const prev = [...(product.galeria_imagens ?? [])];
  const next = prev.filter((x) => x !== u);
  if (next.length === prev.length) throw new Error("Esta URL não está na galeria extra.");
  await updateCommerceDelta((d) => ({
    ...d,
    productPatch: {
      ...d.productPatch,
      [productId]: { ...d.productPatch?.[productId], galeria_imagens: next },
    },
  }));
}

export async function persistDeleteCompositeProduct(productId: string): Promise<void> {
  if (commerceUsesDatabase()) {
    const res = await internalFetch(`/internal/commerce/products/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  await updateCommerceDelta((d) => {
    const addedList = d.addedProducts ?? [];
    const idx = addedList.findIndex((p) => p.id === productId);
    const baseAssignments = d.assignments ?? structuredClone(DEMO_ASSIGNMENTS_INITIAL);
    const baseReqs = d.executionRequests ?? structuredClone(DEMO_EXECUTION_REQUESTS_INITIAL);
    const nextPatch = { ...(d.productPatch ?? {}) };
    delete nextPatch[productId];
    const filteredAssignments = baseAssignments.filter((a) => a.compositeProductId !== productId);
    const filteredReqs = baseReqs.filter((r) => r.compositeProductId !== productId);

    if (idx !== -1) {
      const nextAdded = addedList.filter((_, i) => i !== idx);
      return {
        ...d,
        productPatch: nextPatch,
        addedProducts: nextAdded,
        assignments: filteredAssignments,
        executionRequests: filteredReqs,
      };
    }

    const isSeed = DEMO_COMPOSITE_PRODUCTS.some((p) => p.id === productId);
    if (!isSeed) {
      throw new Error("Peça não encontrada.");
    }

    const prevRemoved = d.removedProductIds ?? [];
    const removedProductIds = prevRemoved.includes(productId)
      ? prevRemoved
      : [...prevRemoved, productId];

    return {
      ...d,
      removedProductIds,
      productPatch: nextPatch,
      assignments: filteredAssignments,
      executionRequests: filteredReqs,
    };
  });
}

function slugifyNomeWeb(nome: string): string {
  const s = nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return s || `peca-${crypto.randomUUID().slice(0, 8)}`;
}

/** SKU interno gerado quando o admin não informa um (prefixo MS + sufixo do id `cp-…`). */
export function autoSkuForNewCompositeProduct(id: string): string {
  return `MS-${id.slice(3).toUpperCase()}`;
}

export async function persistCreateCompositeProduct(
  input: {
    nome: string;
    slug?: string;
    /** Se omitido ou vazio, o SKU é gerado no servidor (API ou cookie demo). */
    sku?: string;
    descricao_curta: string;
    linhas: { supply_item_id: string; quantidade: number }[];
    variacoes_tamanho: string[];
  },
  /** Capa opcional: enviar o `File` da Server Action diretamente no `FormData` (evita reconstruir `File` no Node). */
  coverFile?: File | null,
): Promise<{ id: string; slug: string; sku: string }> {
  const nome = input.nome.trim();
  const desc = input.descricao_curta.trim();
  if (nome.length < 2) throw new Error("Nome muito curto.");
  if (desc.length < 4) throw new Error("Descrição muito curta.");
  if (!input.linhas?.length) throw new Error("Inclua pelo menos um insumo.");
  const variacoes_tamanho = normalizeVariacoesTamanho(input.variacoes_tamanho);
  if (variacoes_tamanho.length === 0) {
    throw new Error("Escolha pelo menos um tamanho (P, M, G, GG, XG ou Único).");
  }

  if (commerceUsesDatabase()) {
    const skuTrim = input.sku?.trim();
    const payload = {
      nome,
      slug: input.slug?.trim() || undefined,
      ...(skuTrim ? { sku: skuTrim } : {}),
      descricao_curta: desc,
      linhas: input.linhas.map((l) => ({
        supply_item_id: l.supply_item_id,
        quantidade: l.quantidade,
      })),
      variacoes_tamanho,
    };

    if (coverFile && coverFile.size > 0) {
      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      fd.append("cover", coverFile);
      const res = await internalFetch("/internal/commerce/products/with-cover", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const created = (await res.json()) as { id: string; slug: string; sku?: string };
      return {
        id: created.id,
        slug: created.slug,
        sku: created.sku ?? autoSkuForNewCompositeProduct(created.id),
      };
    }

    const res = await internalFetch("/internal/commerce/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    const created = (await res.json()) as { id: string; slug: string; sku?: string };
    return {
      id: created.id,
      slug: created.slug,
      sku: created.sku ?? autoSkuForNewCompositeProduct(created.id),
    };
  }

  const state = await getCommerceStateFromCookies();
  let baseSlug = input.slug?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!baseSlug) baseSlug = slugifyNomeWeb(nome);
  const allSlugs = new Set(state.products.map((p) => p.slug));
  let slug = baseSlug;
  let n = 0;
  while (allSlugs.has(slug)) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const linhas: DemoCompositeLine[] = [];
  for (const row of input.linhas) {
    const item = getSupplyItemById(row.supply_item_id.trim());
    if (!item) {
      throw new Error(
        `Insumo não encontrado no modo demo: ${row.supply_item_id}. Use a API com catálogo real ou escolha um insumo do seed.`,
      );
    }
    const q = row.quantidade;
    if (!Number.isFinite(q) || q <= 0) throw new Error("Quantidade inválida numa linha.");
    linhas.push({
      supplyItemId: item.id,
      quantidade: q,
      snapshot_custo_unitario: insumoCostTotal(item),
    });
  }

  const id = `cp-${crypto.randomUUID().slice(0, 12)}`;
  const skuFinal = input.sku?.trim() || autoSkuForNewCompositeProduct(id);
  const product: DemoCompositeProduct = {
    id,
    slug,
    nome,
    sku: skuFinal,
    descricao_curta: desc,
    linhas,
    executor_fee_planejada: 0,
    platform_fee_planejada: 0,
    preco_venda_publico: compositePrecoFromLinhasAndFees(linhas, 0, 0, 0),
    ativo: true,
    admin_pausado: false,
    imagem_url:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=88",
    galeria_imagens: [],
    pacote_altura_cm: 22,
    pacote_largura_cm: 18,
    pacote_comprimento_cm: 8,
    pacote_peso_kg: 0.55,
    variacoes_tamanho,
  };

  await updateCommerceDelta((d) => ({
    ...d,
    addedProducts: [...(d.addedProducts ?? []), product],
  }));
  return { id, slug, sku: skuFinal };
}

export type CheckoutReserveLine = { listing_id: string; quantity: number };

export type CheckoutCustomerOrderPayload = {
  account_id: string;
  customer_email: string;
  customer_name?: string;
  channel: "demo" | "stripe";
  stripe_session_id?: string | null;
  total_brl?: number | null;
  delivery?: {
    recipientName: string;
    phone: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    uf: string;
  };
};

/** Baixa `available_quantity` das ofertas (cookie demo ou API Nest). */
export async function persistCheckoutReserve(
  lines: CheckoutReserveLine[],
  customerOrder?: CheckoutCustomerOrderPayload,
): Promise<void> {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 20) {
    throw new Error("Lista de linhas inválida.");
  }
  if (commerceUsesDatabase()) {
    const res = await internalFetch("/internal/commerce/checkout/reserve", {
      method: "POST",
      body: JSON.stringify({
        lines,
        ...(customerOrder
          ? {
              customer_order: {
                account_id: customerOrder.account_id,
                customer_email: customerOrder.customer_email,
                customer_name: customerOrder.customer_name,
                channel: customerOrder.channel === "stripe" ? "STRIPE" : "DEMO",
                stripe_session_id: customerOrder.stripe_session_id ?? null,
                total_brl: customerOrder.total_brl ?? null,
                delivery: customerOrder.delivery ?? null,
              },
            }
          : {}),
      }),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return;
  }
  const state = await getCommerceStateFromCookies();
  const next = structuredClone(state.productionAssignments);
  for (const row of lines) {
    const id = typeof row.listing_id === "string" ? row.listing_id.trim() : "";
    const q = row.quantity;
    if (!id || !Number.isInteger(q) || q < 1 || q > 99) {
      throw new Error("Dados de reserva inválidos.");
    }
    const idx = next.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Oferta não encontrada.");
    const a = next[idx]!;
    if (a.status !== "PUBLISHED") {
      throw new Error("Uma das ofertas não está mais publicada.");
    }
    if (a.available_quantity < q) {
      throw new Error("Estoque insuficiente para concluir o pedido.");
    }
    next[idx] = { ...a, available_quantity: a.available_quantity - q };
  }
  await updateCommerceDelta((d) => ({
    ...d,
    assignments: next,
  }));
}

/** Corpo enviado à API Nest para e-mails de pedido (Resend / SMTP). */
export type StoreOrderNotifyPayload = {
  channel: "demo" | "stripe";
  customerEmail: string;
  customerName?: string;
  lines: { productName: string; quantity: number; unitPriceBrl: number }[];
  delivery?: {
    recipientName: string;
    phone: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    uf: string;
  };
  stripeSessionId?: string;
  totalBrl?: number;
  /** Frete entrega (costureira → cliente), em BRL. */
  shippingBrl?: number;
};

/** Notifica cliente e admins por e-mail (só com API + `RESEND_API_KEY` / SMTP na Nest). */
export async function notifyStoreOrderCompleted(payload: StoreOrderNotifyPayload): Promise<void> {
  if (!commerceUsesDatabase()) return;
  try {
    const res = await internalFetch("/internal/notifications/store-order", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[notifyStoreOrderCompleted]", await readApiError(res));
    }
  } catch (e) {
    console.error("[notifyStoreOrderCompleted]", e);
  }
}
