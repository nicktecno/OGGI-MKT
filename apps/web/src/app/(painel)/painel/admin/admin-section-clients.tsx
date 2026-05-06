"use client";

import type {
  DemoCompositeProduct,
  DemoExecutionRequest,
  DemoProductionAssignment,
  DemoSupplyItem,
  ExecutorPickerOption,
} from "@/lib/demo-seed";
import { mergeSupplyCatalog } from "@/lib/demo-seed";
import {
  AdminCombinacoesPanel,
  AdminNovaPecaCard,
  AdminPedidosPanel,
  AdminPecasPanel,
} from "./admin-panels";
import { useAdminMutations } from "./use-admin-mutations";

export function CadastroPecaSectionClient({
  supplyCatalogExtra,
  marketplaceImagesEnabled,
}: {
  supplyCatalogExtra?: DemoSupplyItem[];
  marketplaceImagesEnabled: boolean;
}) {
  const { pending, pendingScope, run } = useAdminMutations();
  const supplies = mergeSupplyCatalog(supplyCatalogExtra ?? []);
  return (
    <div className="space-y-8">
      <AdminNovaPecaCard
        supplies={supplies}
        pending={pending}
        pendingScope={pendingScope}
        run={run}
        marketplaceImagesEnabled={marketplaceImagesEnabled}
      />
    </div>
  );
}

export function PecasSectionClient({
  products,
  supplyCatalogExtra,
  marketplaceImagesEnabled,
}: {
  products: DemoCompositeProduct[];
  supplyCatalogExtra?: DemoSupplyItem[];
  /** API Nest + secret internos: envio de fotos da vitrine para R2. */
  marketplaceImagesEnabled: boolean;
}) {
  const { pending, pendingScope, run } = useAdminMutations();
  return (
    <div className="space-y-8">
      <AdminPecasPanel
        products={products}
        supplyCatalogExtra={supplyCatalogExtra}
        marketplaceImagesEnabled={marketplaceImagesEnabled}
        pending={pending}
        pendingScope={pendingScope}
        run={run}
      />
    </div>
  );
}

export function PedidosSectionClient({
  products,
  executionRequests,
}: {
  products: DemoCompositeProduct[];
  executionRequests: DemoExecutionRequest[];
}) {
  const { pending, pendingScope, run } = useAdminMutations();
  return (
    <div className="space-y-8">
      <AdminPedidosPanel
        products={products}
        executionRequests={executionRequests}
        pending={pending}
        pendingScope={pendingScope}
        run={run}
      />
    </div>
  );
}

export function CombinacoesSectionClient({
  products,
  productionAssignments,
  executorOptions,
}: {
  products: DemoCompositeProduct[];
  productionAssignments: DemoProductionAssignment[];
  executorOptions: ExecutorPickerOption[];
}) {
  const { pending, pendingScope, run } = useAdminMutations();
  return (
    <div className="space-y-8">
      <AdminCombinacoesPanel
        products={products}
        productionAssignments={productionAssignments}
        executorOptions={executorOptions}
        pending={pending}
        pendingScope={pendingScope}
        run={run}
      />
    </div>
  );
}
