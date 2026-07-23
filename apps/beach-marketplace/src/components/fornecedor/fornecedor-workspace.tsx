"use client";

import Link from "next/link";
import { FornecedorEntregasPanel } from "@/components/fornecedor/fornecedor-entregas-panel";
import { FornecedorInsumosPanel } from "@/components/fornecedor/fornecedor-insumos-panel";
import type { DemoSupplyItem } from "@/lib/demo-seed";
import type { SupplierFulfillmentLineDto } from "@/lib/platform-account-server";
import { cn } from "@/lib/utils";

export type FornecedorSection = "overview" | "insumos" | "entregas";

type Props = {
  section: FornecedorSection;
  /** Base do painel (ex. `/painel/fornecedor`) para links `?aba=`. */
  painelBase: string;
  apiMode: boolean;
  meusInsumos: DemoSupplyItem[];
  fulfillmentLines: SupplierFulfillmentLineDto[];
  email: string;
};

function SectionLinkCard({
  href,
  title,
  description,
  meta,
}: {
  href: string;
  title: string;
  description: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm ring-1 ring-foreground/[0.03] transition-colors",
        "hover:border-border hover:bg-muted/20 hover:ring-foreground/[0.06]",
      )}
    >
      <p className="font-serif text-lg font-medium text-foreground group-hover:text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-primary">{meta}</p>
    </Link>
  );
}

export function FornecedorWorkspace({
  section,
  painelBase,
  apiMode,
  meusInsumos,
  fulfillmentLines,
  email,
}: Props) {
  if (section === "overview") {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use o menu à esquerda ou escolha abaixo o que quer gerenciar. Cada seção abre no seu próprio contexto.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SectionLinkCard
            href={`${painelBase}?aba=dados`}
            title="Dados da empresa"
            description="Razão social, endereço, contatos e integração Stripe para receber pagamentos."
            meta="Cadastro e pagamentos"
          />
          <SectionLinkCard
            href={`${painelBase}?aba=insumos`}
            title="Meus insumos"
            description="Cadastrar e editar materiais, fotos, pacotes e custos que o admin usa nas peças."
            meta={`${meusInsumos.length} item(ns) · ${apiMode ? "API" : "demonstração"}`}
          />
          <SectionLinkCard
            href={`${painelBase}?aba=entregas`}
            title="Entregas às costureiras"
            description="Envios à costureira quando uma combinação usar os seus insumos — pacote e etiqueta quando o Melhor Envio estiver ligado."
            meta={`${fulfillmentLines.length} linha(ns) de entrega`}
          />
        </div>
      </div>
    );
  }

  if (section === "insumos") {
    return <FornecedorInsumosPanel initialItems={meusInsumos} apiMode={apiMode} supplierEmail={email} />;
  }

  return (
    <FornecedorEntregasPanel lines={fulfillmentLines} demoMode={!apiMode} apiMode={apiMode} />
  );
}
