"use client";

import { useState } from "react";
import { AddToCartActions, type AddToCartPayload } from "@/components/loja/add-to-cart";
import type { RoupaTamanho } from "@/lib/product-sizes";
import { cn } from "@/lib/utils";

type Props = {
  item: AddToCartPayload;
  sizes: RoupaTamanho[];
  className?: string;
};

export function ProductPurchaseSection({ item, sizes, className }: Props) {
  const [selectedSize, setSelectedSize] = useState<RoupaTamanho | null>(
    sizes.length === 1 ? sizes[0]! : null,
  );
  const [sizeError, setSizeError] = useState<string | null>(null);

  function onSelectSize(size: RoupaTamanho) {
    setSelectedSize(size);
    setSizeError(null);
  }

  function requireSize(): string | undefined {
    if (sizes.length === 0) return undefined;
    if (!selectedSize) {
      setSizeError("Escolha um tamanho antes de continuar.");
      return undefined;
    }
    return selectedSize;
  }

  return (
    <div className={cn("space-y-5", className)}>
      {sizes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Tamanho
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Escolha o tamanho"
            aria-required={sizes.length > 1}
          >
            {sizes.map((t) => {
              const active = selectedSize === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelectSize(t)}
                  className={cn(
                    "min-h-11 min-w-[2.75rem] rounded-md border px-4 py-2 text-sm font-medium tabular-nums transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
          {sizeError ? (
            <p className="text-sm text-destructive" role="alert">
              {sizeError}
            </p>
          ) : selectedSize ? (
            <p className="text-sm text-muted-foreground">
              Selecionado: <span className="font-medium text-foreground">{selectedSize}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Toque no tamanho desejado.</p>
          )}
        </div>
      ) : null}

      <AddToCartActions
        item={item}
        selectedSize={selectedSize ?? undefined}
        requireSize={sizes.length > 0 ? requireSize : undefined}
      />
    </div>
  );
}
