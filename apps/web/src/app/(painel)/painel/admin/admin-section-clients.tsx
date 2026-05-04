"use client";

import type {
  DemoCompositeProduct,
  DemoExecutionRequest,
  DemoProductionAssignment,
  DemoSupplyItem,
  ExecutorPickerOption,
} from "@/lib/demo-seed";
import { AdminCombinacoesPanel, AdminPedidosPanel, AdminPecasPanel } from "./admin-panels";
import { AdminFlash, useAdminMutations } from "./use-admin-mutations";

export function PecasSectionClient({
  products,
  supplyCatalogExtra,
}: {
  products: DemoCompositeProduct[];
  supplyCatalogExtra?: DemoSupplyItem[];
}) {
  const { pending, message, error, run } = useAdminMutations();
  return (
    <div className="space-y-6">
      <AdminFlash pending={pending} message={message} error={error} />
      <AdminPecasPanel
        products={products}
        supplyCatalogExtra={supplyCatalogExtra}
        pending={pending}
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
  const { pending, message, error, run } = useAdminMutations();
  return (
    <div className="space-y-6">
      <AdminFlash pending={pending} message={message} error={error} />
      <AdminPedidosPanel
        products={products}
        executionRequests={executionRequests}
        pending={pending}
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
  const { pending, message, error, run } = useAdminMutations();
  return (
    <div className="space-y-6">
      <AdminFlash pending={pending} message={message} error={error} />
      <AdminCombinacoesPanel
        products={products}
        productionAssignments={productionAssignments}
        executorOptions={executorOptions}
        pending={pending}
        run={run}
      />
    </div>
  );
}
