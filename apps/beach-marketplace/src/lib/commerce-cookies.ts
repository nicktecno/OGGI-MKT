import { cookies } from "next/headers";
import type { DemoCompositeProduct } from "@/lib/demo-seed";
import {
  DEMO_ASSIGNMENTS_INITIAL,
  DEMO_COMPOSITE_PRODUCTS,
  DEMO_EXECUTION_REQUESTS_INITIAL,
  type DemoExecutionRequest,
  type DemoProductionAssignment,
} from "@/lib/demo-seed";

const COOKIE = "demo_commerce_v1";

export type DemoProductPatch = Partial<
  Pick<
    DemoCompositeProduct,
    | "linhas"
    | "preco_venda_publico"
    | "executor_fee_planejada"
    | "platform_fee_planejada"
    | "frete_insumos_atribuicao_reais"
    | "preco_venda_congelado"
    | "ativo"
    | "admin_pausado"
    | "pacote_altura_cm"
    | "pacote_largura_cm"
    | "pacote_comprimento_cm"
    | "pacote_peso_kg"
    | "galeria_imagens"
    | "variacoes_tamanho"
  >
>;

export type DemoCommerceDelta = {
  executionRequests?: DemoExecutionRequest[];
  assignments?: DemoProductionAssignment[];
  productPatch?: Record<string, DemoProductPatch>;
  /** Peças criadas no modo demo (cookie), além do seed. */
  addedProducts?: DemoCompositeProduct[];
  /** No modo demo: ids de peças do seed removidas pelo admin (não aparecem na listagem). */
  removedProductIds?: string[];
};

export type DemoCommerceState = {
  products: DemoCompositeProduct[];
  executionRequests: DemoExecutionRequest[];
  productionAssignments: DemoProductionAssignment[];
};

function parseDelta(raw: string | undefined): DemoCommerceDelta {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== "object" || v === null) return {};
    return v as DemoCommerceDelta;
  } catch {
    return {};
  }
}

export async function readCommerceDelta(): Promise<DemoCommerceDelta> {
  const jar = await cookies();
  return parseDelta(jar.get(COOKIE)?.value);
}

export async function writeCommerceDelta(next: DemoCommerceDelta): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(next), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function mergeProducts(delta: DemoCommerceDelta): DemoCompositeProduct[] {
  const patch = delta.productPatch ?? {};
  const removed = new Set(delta.removedProductIds ?? []);
  const base = DEMO_COMPOSITE_PRODUCTS.filter((p) => !removed.has(p.id)).map((p) => ({
    ...p,
    ...(patch[p.id] ?? {}),
  }));
  const added = (delta.addedProducts ?? [])
    .filter((p) => !removed.has(p.id))
    .map((p) => ({ ...p, ...(patch[p.id] ?? {}) }));
  return [...base, ...added];
}

export async function getCommerceStateFromCookies(): Promise<DemoCommerceState> {
  const delta = await readCommerceDelta();
  return {
    products: mergeProducts(delta),
    executionRequests: delta.executionRequests ?? structuredClone(DEMO_EXECUTION_REQUESTS_INITIAL),
    productionAssignments:
      delta.assignments ?? structuredClone(DEMO_ASSIGNMENTS_INITIAL),
  };
}

export async function updateCommerceDelta(
  mutator: (prev: DemoCommerceDelta) => DemoCommerceDelta,
): Promise<void> {
  const prev = await readCommerceDelta();
  await writeCommerceDelta(mutator(prev));
}
