"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FEST_CART_CHANGED_EVENT,
  setFestAddOn,
  writeFestOrder,
} from "@/lib/loslos-fest/cart-storage";
import { FEST_ADD_ONS } from "@/lib/loslos-fest/mock-data";
import type { FestOrderDraft } from "@/lib/loslos-fest/types";
import { formatBrl } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

type Props = {
  order: FestOrderDraft;
  onOrderChange?: (order: FestOrderDraft) => void;
};

export function FestAddOnsSection({ order, onOrderChange }: Props) {
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});

  function persist(next: FestOrderDraft) {
    writeFestOrder(next);
    onOrderChange?.(next);
    window.dispatchEvent(new Event(FEST_CART_CHANGED_EVENT));
  }

  function getQty(productId: string): number {
    return order.addOns.find((a) => a.productId === productId)?.quantity ?? 0;
  }

  function getDraftQty(productId: string): number {
    return draftQty[productId] ?? 1;
  }

  function handleAdd(productId: string) {
    const product = FEST_ADD_ONS.find((p) => p.id === productId);
    if (!product) return;
    const qty = getDraftQty(productId);
    const next = setFestAddOn(order, product, getQty(productId) + qty);
    persist(next);
    setDraftQty((d) => ({ ...d, [productId]: 1 }));
  }

  function handleUpdate(productId: string, quantity: number) {
    const product = FEST_ADD_ONS.find((p) => p.id === productId);
    if (!product) return;
    const next = setFestAddOn(order, product, quantity);
    persist(next);
  }

  if (FEST_ADD_ONS.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-xl font-medium">Itens complementares</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Acessórios opcionais que não ocupam espaço no carrinho de picolés.
        </p>
      </div>
      <ul className="space-y-4">
        {FEST_ADD_ONS.map((product) => {
          const inCart = getQty(product.id);
          const draft = getDraftQty(product.id);
          return (
            <li
              key={product.id}
              className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/80 p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={product.imageUrl} alt="" fill className="object-cover" sizes="80px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <p className="mt-1 text-sm font-semibold text-accent">{formatBrl(product.unitPrice)}/un.</p>
              </div>
              {inCart > 0 ? (
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Diminuir quantidade"
                    onClick={() => handleUpdate(product.id, inCart - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold tabular-nums">{inCart}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Aumentar quantidade"
                    onClick={() => handleUpdate(product.id, inCart + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-2 sm:shrink-0">
                  <div className="space-y-1">
                    <Label htmlFor={`addon-qty-${product.id}`} className="text-xs">
                      Qtd.
                    </Label>
                    <Input
                      id={`addon-qty-${product.id}`}
                      type="number"
                      min={1}
                      max={99}
                      className="h-9 w-20"
                      value={draft}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setDraftQty((d) => ({
                          ...d,
                          [product.id]: Number.isFinite(n) && n > 0 ? Math.min(n, 99) : 1,
                        }));
                      }}
                    />
                  </div>
                  <Button type="button" size="sm" onClick={() => handleAdd(product.id)}>
                    Adicionar
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}