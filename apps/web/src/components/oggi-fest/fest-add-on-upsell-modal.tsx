"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FestAddOnProduct } from "@/lib/oggi-fest/types";
import { cn, formatBrl } from "@/lib/utils";

type Props = {
  open: boolean;
  product: FestAddOnProduct | null;
  onAdd: (quantity: number) => void;
  onDecline: () => void;
};

export function FestAddOnUpsellModal({ open, product, onAdd, onDecline }: Props) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open) setQuantity(1);
  }, [open, product?.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDecline();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onDecline]);

  if (!open || !product || typeof document === "undefined") return null;

  const lineTotal = product.unitPrice * quantity;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fest-upsell-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onDecline}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[min(90vh,640px)] w-full flex-col overflow-hidden",
          "rounded-t-2xl border-2 border-primary/20 bg-background shadow-xl sm:max-w-md sm:rounded-2xl",
        )}
      >
        <div className="border-b-2 border-primary/15 bg-primary px-5 py-4 text-primary-foreground">
          <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.3em] text-primary-foreground/80">
            Complemente seu pedido
          </p>
          <h2
            id="fest-upsell-modal-title"
            className="mt-1 font-heading text-lg font-extrabold uppercase tracking-wide"
          >
            {product.name}
          </h2>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div className="flex gap-4">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-primary/15 bg-card">
              <Image
                src={product.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              <p className="mt-2 text-lg font-bold text-primary">{formatBrl(product.unitPrice)}/un.</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="upsell-qty">Quantidade</Label>
            <Input
              id="upsell-qty"
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setQuantity(Number.isFinite(n) && n > 0 ? Math.min(n, 99) : 1);
              }}
            />
            <p className="text-sm text-muted-foreground">
              Subtotal: <span className="font-semibold text-foreground">{formatBrl(lineTotal)}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t-2 border-primary/15 bg-muted/30 px-5 py-4">
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={() => onAdd(quantity)}
          >
            Acrescentar ao pedido
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onDecline}>
            Não obrigado
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
