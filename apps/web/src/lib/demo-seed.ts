/**
 * Dados de demonstração (MVP sem Postgres) — alinhados ao modelo em docs/domain-model.md.
 * E-mails coincidem com mock-users para login.
 */

import { MOCK_USERS } from "./mock-users";

export type DemoSupplyItem = {
  id: string;
  supplierEmail: string;
  /** Preenchido pela API (razão social / nome da conta); no demo sem API usa-se mock-users. */
  supplier_name?: string | null;
  nome: string;
  sku_interno: string;
  unidade: string;
  /** Null quando o preço fica só na montagem da peça (admin). */
  custo_fornecedor?: number | null;
  frete_ate_executor?: number | null;
  ativo: boolean;
  imagem_url?: string | null;
  observacao?: string | null;
  quantidade_kind?: "METRO" | "PECA";
  quantidade?: number;
  /** Pacote fornecedor → executor (cm / kg). */
  pacote_altura_cm?: number;
  pacote_largura_cm?: number;
  pacote_comprimento_cm?: number;
  pacote_peso_kg?: number;
};

export type DemoCompositeLine = {
  supplyItemId: string;
  quantidade: number;
  /** Custo unitário congelado na montagem (BRL) */
  snapshot_custo_unitario: number;
};

export type DemoCompositeProduct = {
  id: string;
  /** Slug público na URL `/loja/produto/[slug]` */
  slug: string;
  nome: string;
  sku: string;
  descricao_curta: string;
  linhas: DemoCompositeLine[];
  executor_fee_planejada: number;
  platform_fee_planejada: number;
  preco_venda_publico: number;
  /** Um frete B2B por fornecedor (pacote maior do envio), gravado na primeira atribuição ativa. */
  frete_insumos_atribuicao_reais?: number | null;
  /** Quando true, taxas e preço ao cliente não podem ser alterados pelo admin. */
  preco_venda_congelado?: boolean;
  ativo: boolean;
  admin_pausado: boolean;
  imagem_url: string;
  /** URLs extra (galeria na página do produto); a capa é `imagem_url`. */
  galeria_imagens?: string[];
  /** Tamanhos oferecidos (P, M, G, GG, XG, Único). */
  variacoes_tamanho?: string[];
  /** Pacote peça pronta → cliente (costureira posta). */
  pacote_altura_cm: number;
  pacote_largura_cm: number;
  pacote_comprimento_cm: number;
  pacote_peso_kg: number;
};

/** Oferta na vitrine = atribuição em `PUBLISHED`. */
export type DemoListing = {
  id: string;
  compositeProductId: string;
  executorEmail: string;
  executorNome: string;
  cidade_origem: string;
  cep_origem: string;
  available_quantity: number;
  status: "PUBLISHED";
  storefront_highlight_order?: number | null;
};

export type DemoExecutionRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export type DemoExecutionRequest = {
  id: string;
  compositeProductId: string;
  executorEmail: string;
  executorNome: string;
  status: DemoExecutionRequestStatus;
  reviewed_at?: string;
  rejection_reason?: string;
};

export type DemoProductionAssignmentStatus =
  | "ASSIGNED"
  | "IN_PRODUCTION"
  | "PRODUCTION_DONE"
  | "PUBLISHED"
  | "ARCHIVED";

export type DemoAssignmentSource = "ADMIN_DIRECT" | "REQUEST_APPROVED";

export type DemoProductionAssignment = {
  id: string;
  compositeProductId: string;
  executorEmail: string;
  executorNome: string;
  cidade_origem: string;
  cep_origem: string;
  available_quantity: number;
  units_produced: number;
  status: DemoProductionAssignmentStatus;
  assignment_source: DemoAssignmentSource;
  execution_request_id: string | null;
  /** Ordem no carrossel de destaque da loja (0 = primeiro). Omitido ou null = não forçar destaque. */
  storefront_highlight_order?: number | null;
};

/** Opção no seletor admin “peça + costureira” (vínculo por conta cadastrada). */
export type ExecutorPickerOption = {
  email: string;
  displayName: string;
};

export const DEMO_EXECUTOR_PICKER_FALLBACK: ExecutorPickerOption[] = [
  { email: "executor@demo.local", displayName: "Carla Mendes — Atelier" },
];

/** Costureiras já presentes no estado demo (atribuições e pedidos), ou fallback do seed. */
export function executorOptionsFromDemoCommerce(state: {
  productionAssignments: DemoProductionAssignment[];
  executionRequests: DemoExecutionRequest[];
}): ExecutorPickerOption[] {
  const byEmail = new Map<string, string>();
  for (const a of state.productionAssignments) {
    const k = a.executorEmail.trim().toLowerCase();
    if (!byEmail.has(k)) byEmail.set(k, a.executorNome.trim());
  }
  for (const r of state.executionRequests) {
    const k = r.executorEmail.trim().toLowerCase();
    if (!byEmail.has(k)) byEmail.set(k, r.executorNome.trim());
  }
  const list = [...byEmail.entries()]
    .map(([email, displayName]) => ({ email, displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));
  return list.length > 0 ? list : DEMO_EXECUTOR_PICKER_FALLBACK;
}

export type SupplierPickerOption = { email: string; label: string };

function supplierDisplayLabelForInsumoRow(s: DemoSupplyItem): string {
  const email = s.supplierEmail?.trim() ?? "";
  const fromApi = s.supplier_name?.trim();
  if (fromApi) return fromApi;
  const mock = MOCK_USERS[email.toLowerCase()]?.displayName?.trim();
  if (mock) return mock;
  return email;
}

/** Fornecedores distintos do catálogo com nome para exibição (API ou contas demo; senão e-mail). */
export function supplierOptionsFromCatalog(supplies: DemoSupplyItem[]): SupplierPickerOption[] {
  const byKey = new Map<string, { email: string; label: string }>();
  for (const s of supplies) {
    const email = s.supplierEmail?.trim();
    if (!email) continue;
    const k = email.toLowerCase();
    const labelCandidate = supplierDisplayLabelForInsumoRow(s);
    const prev = byKey.get(k);
    if (!prev) {
      byKey.set(k, { email, label: labelCandidate });
    } else {
      const prevIsEmailOnly = prev.label.toLowerCase() === prev.email.toLowerCase();
      const candIsName = labelCandidate.toLowerCase() !== email.toLowerCase();
      if (prevIsEmailOnly && candIsName) byKey.set(k, { email: prev.email, label: labelCandidate });
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }),
  );
}

export const DEMO_SUPPLY_ITEMS: DemoSupplyItem[] = [
  {
    id: "supply-linho-offwhite",
    supplierEmail: "fornecedor@demo.local",
    supplier_name: "Bruno Tecidos Ltda",
    nome: "Linho premium off-white",
    sku_interno: "TEC-LIN-OW-240",
    unidade: "m",
    custo_fornecedor: 89.9,
    frete_ate_executor: 12.0,
    ativo: true,
    quantidade_kind: "METRO",
    quantidade: 1,
    observacao: "Largura útil 1,40 m.",
    pacote_altura_cm: 32,
    pacote_largura_cm: 28,
    pacote_comprimento_cm: 10,
    pacote_peso_kg: 1.35,
  },
  {
    id: "supply-ziper-invisivel-40",
    supplierEmail: "fornecedor@demo.local",
    supplier_name: "Bruno Tecidos Ltda",
    nome: "Zíper invisível 40 cm — preto",
    sku_interno: "AVI-ZIP-INV-040-BLK",
    unidade: "pc",
    custo_fornecedor: 4.5,
    frete_ate_executor: 3.0,
    ativo: true,
    quantidade_kind: "PECA",
    quantidade: 1,
    pacote_altura_cm: 16,
    pacote_largura_cm: 12,
    pacote_comprimento_cm: 5,
    pacote_peso_kg: 0.22,
  },
  {
    id: "supply-botoes-madreperola-18",
    supplierEmail: "aviamentos@demo.local",
    supplier_name: "Maria Aviamentos ME",
    nome: "Botões madrepérola 18 mm — branco",
    sku_interno: "AVI-BTN-MP-18-WHT",
    unidade: "pc",
    custo_fornecedor: 0.85,
    frete_ate_executor: 2.5,
    ativo: true,
    quantidade_kind: "PECA",
    quantidade: 1,
    observacao: "Cartela com 6 unidades.",
    pacote_altura_cm: 12,
    pacote_largura_cm: 10,
    pacote_comprimento_cm: 3,
    pacote_peso_kg: 0.08,
  },
  {
    id: "supply-elastico-trancado-20",
    supplierEmail: "aviamentos@demo.local",
    supplier_name: "Maria Aviamentos ME",
    nome: "Elástico trançado 20 mm — preto",
    sku_interno: "AVI-ELA-T20-BLK",
    unidade: "m",
    custo_fornecedor: 6.2,
    frete_ate_executor: 4.0,
    ativo: true,
    quantidade_kind: "METRO",
    quantidade: 1,
    pacote_altura_cm: 14,
    pacote_largura_cm: 12,
    pacote_comprimento_cm: 6,
    pacote_peso_kg: 0.18,
  },
];

export const DEMO_COMPOSITE_PRODUCTS: DemoCompositeProduct[] = [
  {
    id: "cp-vestido-linho-classico",
    slug: "vestido-linho-classico",
    nome: "Vestido midi em linho — silhueta clássica",
    sku: "LOOK-2026-VEST-LINHO",
    descricao_curta:
      "Linhas limpas, caimento fluido e acabamento discreto. Peça de vitrine em linho, pensada para um guarda-roupa atemporal.",
    linhas: [
      {
        supplyItemId: "supply-linho-offwhite",
        quantidade: 2.2,
        snapshot_custo_unitario: 89.9,
      },
      {
        supplyItemId: "supply-ziper-invisivel-40",
        quantidade: 1,
        snapshot_custo_unitario: 4.5,
      },
    ],
    executor_fee_planejada: 85,
    platform_fee_planejada: 45,
    /** materiais + frete B2B insumos + costureira + loja (atribuição demo já aplicada). */
    preco_venda_publico: 360.75,
    frete_insumos_atribuicao_reais: 28.47,
    preco_venda_congelado: true,
    ativo: true,
    admin_pausado: false,
    pacote_altura_cm: 24,
    pacote_largura_cm: 20,
    pacote_comprimento_cm: 9,
    pacote_peso_kg: 0.62,
    imagem_url:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=88",
    galeria_imagens: [],
    variacoes_tamanho: ["P", "M", "G", "GG", "XG"],
  },
  {
    id: "cp-cachecol",
    slug: "cachecol-trico-serra",
    nome: "Cachecol em tricô — ponto textura serra",
    sku: "LOOK-2026-CACHECOL-TRIC",
    descricao_curta:
      "Camadas macias, acabamento à mão e fio encorpado. Modelo pensado para inverno urbano — ainda sem oferta publicada até a produção ser aprovada e liberada.",
    linhas: [
      {
        supplyItemId: "supply-linho-offwhite",
        quantidade: 0.35,
        snapshot_custo_unitario: 89.9,
      },
      {
        supplyItemId: "supply-ziper-invisivel-40",
        quantidade: 1,
        snapshot_custo_unitario: 4.5,
      },
    ],
    executor_fee_planejada: 35,
    platform_fee_planejada: 22,
    /** materiais + frete B2B + costureira + loja (atribuição demo). */
    preco_venda_publico: 121.44,
    frete_insumos_atribuicao_reais: 28.47,
    preco_venda_congelado: true,
    ativo: true,
    admin_pausado: false,
    pacote_altura_cm: 18,
    pacote_largura_cm: 14,
    pacote_comprimento_cm: 7,
    pacote_peso_kg: 0.38,
    imagem_url:
      "https://images.unsplash.com/photo-1520903920243-bd6f951d1a37?auto=format&fit=crop&w=1200&q=88",
    galeria_imagens: [],
    variacoes_tamanho: ["Único"],
  },
];

/** Atribuições de produção (domínio). A vitrine usa apenas `PUBLISHED`. */
export const DEMO_ASSIGNMENTS_INITIAL: DemoProductionAssignment[] = [
  {
    id: "asg-vestido-carla",
    compositeProductId: "cp-vestido-linho-classico",
    executorEmail: "executor@demo.local",
    executorNome: "Carla Mendes — Atelier",
    cidade_origem: "São Paulo — SP",
    cep_origem: "01310-100",
    available_quantity: 3,
    units_produced: 3,
    status: "PUBLISHED",
    assignment_source: "ADMIN_DIRECT",
    execution_request_id: null,
    storefront_highlight_order: 0,
  },
  {
    id: "asg-cachecol-carla",
    compositeProductId: "cp-cachecol",
    executorEmail: "executor@demo.local",
    executorNome: "Carla Mendes — Atelier",
    cidade_origem: "São Paulo — SP",
    cep_origem: "01310-100",
    available_quantity: 2,
    units_produced: 2,
    status: "PUBLISHED",
    assignment_source: "ADMIN_DIRECT",
    execution_request_id: null,
    storefront_highlight_order: 1,
  },
];

/** Solicitações de execução aguardando decisão do admin (MVP). */
export const DEMO_EXECUTION_REQUESTS_INITIAL: DemoExecutionRequest[] = [
  {
    id: "req-cachecol-carla",
    compositeProductId: "cp-cachecol",
    executorEmail: "executor@demo.local",
    executorNome: "Carla Mendes",
    status: "PENDING",
  },
];

export function getSupplyItemById(id: string): DemoSupplyItem | undefined {
  return DEMO_SUPPLY_ITEMS.find((s) => s.id === id);
}

/** Catálogo demo + insumos vindos da API (admin monta peça). */
export function mergeSupplyCatalog(extra: DemoSupplyItem[]): DemoSupplyItem[] {
  const map = new Map<string, DemoSupplyItem>();
  for (const s of DEMO_SUPPLY_ITEMS) map.set(s.id, s);
  if (!Array.isArray(extra)) return Array.from(map.values());
  for (const s of extra) {
    if (s && typeof s === "object" && typeof s.id === "string" && s.id.trim()) map.set(s.id, s);
  }
  return Array.from(map.values());
}

export function getCompositeProductById(
  id: string,
  products: DemoCompositeProduct[] = DEMO_COMPOSITE_PRODUCTS,
): DemoCompositeProduct | undefined {
  return products.find((p) => p.id === id);
}

export function listingFromPublishedAssignment(
  a: DemoProductionAssignment,
): DemoListing | null {
  if (a.status !== "PUBLISHED") return null;
  return {
    id: a.id,
    compositeProductId: a.compositeProductId,
    executorEmail: a.executorEmail,
    executorNome: a.executorNome,
    cidade_origem: a.cidade_origem,
    cep_origem: a.cep_origem,
    available_quantity: a.available_quantity,
    status: "PUBLISHED",
    storefront_highlight_order:
      typeof a.storefront_highlight_order === "number" ? a.storefront_highlight_order : null,
  };
}

export function publishedListingsFromAssignments(
  assignments: DemoProductionAssignment[],
): DemoListing[] {
  return assignments
    .filter((a) => a.status === "PUBLISHED")
    .map((a) => listingFromPublishedAssignment(a))
    .filter((l): l is DemoListing => l !== null);
}

export type CatalogRow = {
  listing: DemoListing;
  product: DemoCompositeProduct;
};

/** Ofertas publicadas com produto resolvido (para vitrine e busca). */
export function getCatalogRowsFromData(
  products: DemoCompositeProduct[],
  assignments: DemoProductionAssignment[],
): CatalogRow[] {
  return publishedListingsFromAssignments(assignments).flatMap((listing) => {
    const product = getCompositeProductById(listing.compositeProductId, products);
    if (!product || !product.ativo || product.admin_pausado) return [];
    return [{ listing, product }];
  });
}

/** URLs para carrossel na ficha do produto: capa + extras (sem duplicar). */
export function productImageSlides(product: DemoCompositeProduct): string[] {
  const capa = typeof product.imagem_url === "string" ? product.imagem_url.trim() : "";
  const extra = (product.galeria_imagens ?? [])
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean);
  const out: string[] = [];
  if (capa) out.push(capa);
  for (const u of extra) {
    if (!out.includes(u)) out.push(u);
  }
  return out.length > 0 ? out : capa ? [capa] : [];
}

/**
 * Ofertas que entram no herói da loja: as que têm `storefront_highlight_order` definido (≥0), por ordem.
 * Se nenhuma estiver marcada, devolve só a primeira linha do catálogo (comportamento anterior).
 */
export function getStorefrontHeroRows(rows: CatalogRow[]): CatalogRow[] {
  const tagged = rows.filter(
    (r) => typeof r.listing.storefront_highlight_order === "number" && !Number.isNaN(r.listing.storefront_highlight_order),
  );
  if (tagged.length === 0) {
    return rows.length > 0 ? [rows[0]] : [];
  }
  return [...tagged].sort((a, b) => {
    const ao = a.listing.storefront_highlight_order ?? 0;
    const bo = b.listing.storefront_highlight_order ?? 0;
    if (ao !== bo) return ao - bo;
    return a.listing.id.localeCompare(b.listing.id);
  });
}

export function getProductBySlug(
  slug: string,
  products: DemoCompositeProduct[] = DEMO_COMPOSITE_PRODUCTS,
): DemoCompositeProduct | undefined {
  const s = slug.trim().toLowerCase();
  return products.find((p) => p.slug.toLowerCase() === s);
}

export function getListingForProduct(
  productId: string,
  assignments: DemoProductionAssignment[],
): DemoListing | undefined {
  return publishedListingsFromAssignments(assignments).find(
    (l) => l.compositeProductId === productId,
  );
}

/** Busca simples em nome, descrição, SKU e dados da oferta (demo). */
export function searchCatalogRowsFromData(
  products: DemoCompositeProduct[],
  assignments: DemoProductionAssignment[],
  query: string | undefined,
): CatalogRow[] {
  const rows = getCatalogRowsFromData(products, assignments);
  const raw = query?.trim() ?? "";
  if (!raw) return rows;
  const tokens = raw
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  return rows.filter(({ listing, product }) => {
    const hay = [
      product.nome,
      product.descricao_curta,
      product.sku,
      product.slug,
      listing.executorNome,
      listing.cidade_origem,
      listing.cep_origem,
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

export function insumoCostTotal(item: DemoSupplyItem): number {
  return (item.custo_fornecedor ?? 0) + (item.frete_ate_executor ?? 0);
}

export function lineTotal(line: DemoCompositeLine): number {
  return line.quantidade * line.snapshot_custo_unitario;
}

export function compositeInsumosTotal(product: DemoCompositeProduct): number {
  return product.linhas.reduce((acc, line) => acc + lineTotal(line), 0);
}

/** Soma de custos de materiais + frete B2B (se já cotado na atribuição) + repasse costureira + margem loja. */
export function compositePrecoFromLinhasAndFees(
  linhas: DemoCompositeLine[],
  executor_fee_planejada: number,
  platform_fee_planejada: number,
  frete_insumos_atribuicao_reais = 0,
): number {
  const materiais = linhas.reduce((acc, line) => acc + lineTotal(line), 0);
  return materiais + frete_insumos_atribuicao_reais + executor_fee_planejada + platform_fee_planejada;
}

export function compositePrecoLojaPlanejado(product: DemoCompositeProduct): number {
  return compositePrecoFromLinhasAndFees(
    product.linhas,
    product.executor_fee_planejada,
    product.platform_fee_planejada,
    product.frete_insumos_atribuicao_reais ?? 0,
  );
}

/** Preço exibido antes da atribuição: materiais + taxas, sem frete B2B dos insumos. */
export function compositePrecoPreviaSemFreteB2B(product: DemoCompositeProduct): number {
  return compositePrecoFromLinhasAndFees(
    product.linhas,
    product.executor_fee_planejada,
    product.platform_fee_planejada,
    0,
  );
}

export type ResolvedLine = DemoCompositeLine & { insumo: DemoSupplyItem };

export function resolveCompositeLines(
  product: DemoCompositeProduct,
  extraCatalog: DemoSupplyItem[] = [],
): ResolvedLine[] {
  return product.linhas.map((line) => {
    const insumo =
      extraCatalog.find((s) => s.id === line.supplyItemId) ?? getSupplyItemById(line.supplyItemId);
    if (!insumo) {
      throw new Error(`Insumo ausente: ${line.supplyItemId}`);
    }
    return { ...line, insumo };
  });
}

/** Igual ao stub da API até existir Melhor Envio (CEP + volume + peso). */
function demoVolumeCm3(alturaCm: number, larguraCm: number, comprimentoCm: number): number {
  return Math.max(0, alturaCm) * Math.max(0, larguraCm) * Math.max(0, comprimentoCm);
}

function demoPickShipmentPackFromSupplies(
  items: { alturaCm: number; larguraCm: number; comprimentoCm: number; pesoKg: number }[],
): { alturaCm: number; larguraCm: number; comprimentoCm: number; pesoKg: number } {
  if (items.length === 0) {
    return { alturaCm: 14, larguraCm: 12, comprimentoCm: 5, pesoKg: 0.4 };
  }
  let best = items[0];
  let bestV = demoVolumeCm3(best.alturaCm, best.larguraCm, best.comprimentoCm);
  for (let i = 1; i < items.length; i++) {
    const cur = items[i];
    const v = demoVolumeCm3(cur.alturaCm, cur.larguraCm, cur.comprimentoCm);
    if (v > bestV) {
      bestV = v;
      best = cur;
    }
  }
  const pesoKg = Math.max(...items.map((x) => x.pesoKg));
  return {
    alturaCm: best.alturaCm,
    larguraCm: best.larguraCm,
    comprimentoCm: best.comprimentoCm,
    pesoKg,
  };
}

function demoStubFreteB2B(params: {
  cepOrigem: string;
  cepDestino: string;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  pesoKg: number;
}): number {
  const vol = demoVolumeCm3(params.alturaCm, params.larguraCm, params.comprimentoCm);
  const o = parseInt(params.cepOrigem.replace(/\D/g, "").slice(0, 5), 10) || 10000;
  const d = parseInt(params.cepDestino.replace(/\D/g, "").slice(0, 5), 10) || 10000;
  const dist = Math.abs(o - d) / 1000;
  const base = 14.9 + dist * 8.5 + (vol / 8000) * 3.2 + params.pesoKg * 7.4;
  return Math.round(Math.max(0, base) * 100) / 100;
}

/**
 * Estimativa B2B fornecedor → costureira no modo cookie (mesma regra que a API: maior pacote entre insumos).
 */
export function demoFreteB2BForCompositeProduct(
  product: DemoCompositeProduct,
  opts?: { cepOrigem?: string; cepDestino?: string },
  extraCatalog: DemoSupplyItem[] = [],
): number {
  const resolved = resolveCompositeLines(product, extraCatalog);
  const packs = resolved.map((row) => ({
    alturaCm: row.insumo.pacote_altura_cm ?? 14,
    larguraCm: row.insumo.pacote_largura_cm ?? 12,
    comprimentoCm: row.insumo.pacote_comprimento_cm ?? 5,
    pesoKg: row.insumo.pacote_peso_kg ?? 0.4,
  }));
  const ship = demoPickShipmentPackFromSupplies(packs);
  return demoStubFreteB2B({
    cepOrigem: opts?.cepOrigem ?? "01310-100",
    cepDestino: opts?.cepDestino ?? "01310-100",
    ...ship,
  });
}
