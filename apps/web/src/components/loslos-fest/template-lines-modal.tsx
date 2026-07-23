"use client";

import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { buildLinesFromTemplate, getLineById } from "@/lib/loslos-fest/catalog-helpers";
import type { AdminCatalog } from "@/lib/loslos-fest/admin-catalog-storage";
import type { FestTemplate } from "@/lib/loslos-fest/types";
import { cn, formatBrl } from "@/lib/utils";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FestTemplate | null;
  capacity: number;
  catalog: AdminCatalog;
};

export function TemplateLinesModal({ open, onOpenChange, template, capacity, catalog }: Props) {
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

  if (!open || !template || typeof document === "undefined") return null;

  const builtLines = buildLinesFromTemplate(catalog, template, capacity);
  const totalUnits = builtLines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = builtLines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-lines-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden",
          "rounded-t-2xl border-2 border-primary/20 bg-background shadow-xl sm:max-w-lg sm:rounded-2xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-primary/15 bg-primary px-5 py-4 text-primary-foreground">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.3em] text-primary-foreground/80">
              Composição do modelo
            </p>
            <h2
              id="template-lines-modal-title"
              className="mt-1 font-heading text-lg font-extrabold uppercase tracking-wide"
            >
              {template.name}
            </h2>
            <p className="mt-1 text-sm text-primary-foreground/90">{template.description}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-primary-foreground hover:bg-card/20 hover:text-primary-foreground"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Distribuição para carrinho de <strong className="text-foreground">{capacity} unidades</strong>{" "}
            ({totalUnits} picolés neste modelo).
          </p>
          <ul className="space-y-3">
            {template.lines.map((tl) => {
              const meta = getLineById(catalog, tl.lineId);
              const built = builtLines.find((l) => l.lineId === tl.lineId);
              if (!meta) return null;
              const qty = built?.quantity ?? 0;
              const lineTotal = qty * meta.unitPrice;
              return (
                <li
                  key={tl.lineId}
                  className="flex gap-4 rounded-xl border-2 border-primary/15 bg-muted/40 p-3"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-card">
                    <Image
                      src={meta.imageUrl}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-sm font-extrabold uppercase tracking-wide text-primary">
                      {meta.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{meta.description}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span>
                        <span className="text-muted-foreground">Participação: </span>
                        <span className="font-bold text-primary">{tl.percent}%</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Quantidade: </span>
                        <span className="font-bold tabular-nums">{qty} un.</span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Preço: </span>
                        <span className="font-semibold">{formatBrl(meta.unitPrice)}/un.</span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-foreground">
                      Subtotal da linha: {formatBrl(lineTotal)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t-2 border-primary/15 bg-muted/30 px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Subtotal estimado (produtos)</span>
            <span className="text-lg font-extrabold text-primary">{formatBrl(subtotal)}</span>
          </div>
          <Button type="button" className="mt-4 w-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
