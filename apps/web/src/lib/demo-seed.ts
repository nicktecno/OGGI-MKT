/**
 * Dados de demonstração (MVP sem Postgres) — alinhados ao modelo em docs/domain-model.md.
 * E-mails coincidem com mock-users para login.
 */

export type DemoSupplyItem = {
  id: string;
  supplierEmail: string;
  nome: string;
  sku_interno: string;
  unidade: string;
  custo_fornecedor: number;
  frete_ate_executor: number;
  ativo: boolean;
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
  ativo: boolean;
  admin_pausado: boolean;
  imagem_url: string;
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

export const DEMO_SUPPLY_ITEMS: DemoSupplyItem[] = [
  {
    id: "supply-linho-offwhite",
    supplierEmail: "fornecedor@demo.local",
    nome: "Linho premium off-white",
    sku_interno: "TEC-LIN-OW-240",
    unidade: "m",
    custo_fornecedor: 89.9,
    frete_ate_executor: 12.0,
    ativo: true,
  },
  {
    id: "supply-ziper-invisivel-40",
    supplierEmail: "fornecedor@demo.local",
    nome: "Zíper invisível 40 cm — preto",
    sku_interno: "AVI-ZIP-INV-040-BLK",
    unidade: "un",
    custo_fornecedor: 4.5,
    frete_ate_executor: 3.0,
    ativo: true,
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
    preco_venda_publico: 459.9,
    ativo: true,
    admin_pausado: false,
    imagem_url:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=88",
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
    preco_venda_publico: 189.9,
    ativo: true,
    admin_pausado: false,
    imagem_url:
      "https://images.unsplash.com/photo-1520903920243-bd6f951d1a37?auto=format&fit=crop&w=1200&q=88",
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
  return item.custo_fornecedor + item.frete_ate_executor;
}

export function lineTotal(line: DemoCompositeLine): number {
  return line.quantidade * line.snapshot_custo_unitario;
}

export function compositeInsumosTotal(product: DemoCompositeProduct): number {
  return product.linhas.reduce((acc, line) => acc + lineTotal(line), 0);
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
