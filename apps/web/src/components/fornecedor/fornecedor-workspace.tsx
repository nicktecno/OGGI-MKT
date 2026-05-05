"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FornecedorEntregasPanel } from "@/components/fornecedor/fornecedor-entregas-panel";
import { FornecedorInsumosPanel } from "@/components/fornecedor/fornecedor-insumos-panel";
import type { DemoSupplyItem } from "@/lib/demo-seed";
import type { SupplierFulfillmentLineDto } from "@/lib/platform-account-server";

type TabKey = "insumos" | "entregas";

type Props = {
  apiMode: boolean;
  meusInsumos: DemoSupplyItem[];
  fulfillmentLines: SupplierFulfillmentLineDto[];
  email: string;
  initialTab: TabKey;
};

function tabFromSearchParam(aba: string | null): TabKey {
  return aba === "entregas" ? "entregas" : "insumos";
}

export function FornecedorWorkspace({
  apiMode,
  meusInsumos,
  fulfillmentLines,
  email,
  initialTab,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>(initialTab);

  const aba = searchParams.get("aba");
  useEffect(() => {
    setTab(tabFromSearchParam(aba));
  }, [aba]);

  function go(tabKey: TabKey) {
    const q = tabKey === "entregas" ? "entregas" : "insumos";
    router.replace(`${pathname}?aba=${q}`, { scroll: false });
    setTab(tabKey);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        <Button
          type="button"
          variant={tab === "insumos" ? "default" : "ghost"}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
          data-active={tab === "insumos"}
          onClick={() => go("insumos")}
        >
          Meus insumos
        </Button>
        <Button
          type="button"
          variant={tab === "entregas" ? "default" : "ghost"}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
          data-active={tab === "entregas"}
          onClick={() => go("entregas")}
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
