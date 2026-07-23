"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  insumoCostTotal,
  supplierDisplayLabelForInsumoRow,
  type DemoSupplyItem,
} from "@/lib/demo-seed";
import { cn, formatBrl } from "@/lib/utils";

function labelQuantidadeKind(k?: string): string {
  if (k === "METRO") return "Metro";
  if (k === "PECA") return "Peça (unidade)";
  return "—";
}

export type SupplyItemDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DemoSupplyItem | null;
  /** Quantidade usada na montagem do modelo (opcional). */
  quantidadeNaMontagem?: number;
  /** Custo unitário gravado na montagem desta peça (opcional; senão usa catálogo). */
  custoUnitarioMontagem?: number;
};

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/40 py-2.5 last:border-0 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function SupplyItemDetailModal({
  open,
  onOpenChange,
  item,
  quantidadeNaMontagem,
  custoUnitarioMontagem,
}: SupplyItemDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!open || !item || typeof document === "undefined") return null;

  const img = item.imagem_url?.trim();
  const custoCat = insumoCostTotal(item);
  const custoMont =
    typeof custoUnitarioMontagem === "number" && Number.isFinite(custoUnitarioMontagem)
      ? custoUnitarioMontagem
      : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supply-detail-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-[1] flex max-h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
          <h2 id="supply-detail-modal-title" className="font-serif text-lg font-semibold leading-snug text-foreground sm:text-xl">
            {item.nome}
          </h2>
          <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-5">
            {img ? (
              <div className="mb-5 overflow-hidden rounded-xl border border-border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL R2 ou externa */}
                <img
                  src={img}
                  alt=""
                  className="mx-auto max-h-[min(52vh,420px)] w-full object-contain object-center"
                />
              </div>
            ) : (
              <div className="mb-5 flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                Sem imagem cadastrada
              </div>
            )}
            <dl>
              <DetailRow label="Fornecedor">{supplierDisplayLabelForInsumoRow(item)}</DetailRow>
              <DetailRow label="E-mail fornecedor">{item.supplierEmail || "—"}</DetailRow>
              <DetailRow label="SKU interno">{item.sku_interno}</DetailRow>
              <DetailRow label="Unidade de venda">{item.unidade}</DetailRow>
              <DetailRow label="Tipo de quantidade">{labelQuantidadeKind(item.quantidade_kind)}</DetailRow>
              {item.quantidade_kind && item.quantidade != null ? (
                <DetailRow label="Quantidade no lote">
                  {item.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}
                </DetailRow>
              ) : null}
              <DetailRow label="Ativo na loja">{item.ativo ? "Sim" : "Não"}</DetailRow>
              <DetailRow label="Custo fornecedor (catálogo)">
                {item.custo_fornecedor != null ? formatBrl(item.custo_fornecedor) : "—"}
              </DetailRow>
              <DetailRow label="Frete até executor (catálogo)">
                {item.frete_ate_executor != null ? formatBrl(item.frete_ate_executor) : "—"}
              </DetailRow>
              <DetailRow label="Custo unitário (catálogo)">{formatBrl(custoCat)}</DetailRow>
              {custoMont != null ? (
                <DetailRow label="Custo unitário nesta montagem">{formatBrl(custoMont)}</DetailRow>
              ) : null}
              {quantidadeNaMontagem != null ? (
                <DetailRow label="Quantidade nesta peça">
                  {quantidadeNaMontagem.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} {item.unidade}
                </DetailRow>
              ) : null}
              <DetailRow label="Pacote (fornecedor → executor)">
                {[
                  item.pacote_altura_cm != null ? `${item.pacote_altura_cm} cm alt.` : null,
                  item.pacote_largura_cm != null ? `${item.pacote_largura_cm} cm larg.` : null,
                  item.pacote_comprimento_cm != null ? `${item.pacote_comprimento_cm} cm comp.` : null,
                  item.pacote_peso_kg != null ? `${item.pacote_peso_kg} kg` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </DetailRow>
              <DetailRow label="Observações">{item.observacao?.trim() ? item.observacao : "—"}</DetailRow>
            </dl>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
