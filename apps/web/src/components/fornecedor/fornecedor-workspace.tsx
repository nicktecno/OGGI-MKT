"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FornecedorEntregasPanel } from "@/components/fornecedor/fornecedor-entregas-panel";
import { FornecedorInsumosPanel } from "@/components/fornecedor/fornecedor-insumos-panel";
import type { DemoSupplyItem } from "@/lib/demo-seed";
import type { SupplierFulfillmentLineDto } from "@/lib/platform-account-server";

type Props = {
  apiMode: boolean;
  meusInsumos: DemoSupplyItem[];
  fulfillmentLines: SupplierFulfillmentLineDto[];
  email: string;
};

export function FornecedorWorkspace({ apiMode, meusInsumos, fulfillmentLines, email }: Props) {
  const [tab, setTab] = useState<"insumos" | "entregas">("insumos");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        <Button
          type="button"
          variant={tab === "insumos" ? "default" : "ghost"}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
          data-active={tab === "insumos"}
          onClick={() => setTab("insumos")}
        >
          Meus insumos
        </Button>
        <Button
          type="button"
          variant={tab === "entregas" ? "default" : "ghost"}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
          data-active={tab === "entregas"}
          onClick={() => setTab("entregas")}
        >
          Entregas aos executores
        </Button>
      </div>

      {tab === "insumos" ? (
        <FornecedorInsumosPanel initialItems={meusInsumos} apiMode={apiMode} supplierEmail={email} />
      ) : (
        <FornecedorEntregasPanel lines={fulfillmentLines} demoMode={!apiMode} />
      )}
    </div>
  );
}
