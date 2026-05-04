"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { CartState } from "@/lib/cart-types";
import {
  CART_CHANGED_EVENT,
  cartTotal,
  readCart,
  removeLine,
  setLineQuantity,
} from "@/lib/cart-storage";
import { cn, formatBrl } from "@/lib/utils";

export function CarrinhoView() {
  const [cart, setCart] = useState<CartState>({ version: 1, lines: [] });

  useEffect(() => {
    function sync() {
      setCart(readCart());
    }
    sync();
    window.addEventListener(CART_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/40 p-10 text-center">
        <p className="text-muted-foreground">Seu carrinho está vazio.</p>
        <Link
          href="/loja"
          className={cn(buttonVariants({ variant: "outline" }), "mt-6 inline-flex")}
        >
          Continuar comprando
        </Link>
      </div>
    );
  }

  const total = cartTotal(cart);

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-border rounded-xl border border-border/80 bg-card/40">
        {cart.lines.map((line) => (
          <li key={line.listingId} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            {line.imageUrl ? (
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 sm:h-24 sm:w-24">
                <Image
                  src={line.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="hidden h-24 w-24 shrink-0 rounded-lg border border-dashed border-border bg-muted/20 sm:block" />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <Link
                href={`/loja/produto/${line.productSlug}`}
                className="font-serif text-lg font-medium text-foreground hover:underline"
              >
                {line.productName}
              </Link>
              <p className="text-sm text-muted-foreground">{line.executorNome}</p>
              <p className="font-mono text-sm tabular-nums text-foreground">{formatBrl(line.unitPrice)} un.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Qtd.
                <input
                  type="number"
                  min={1}
                  max={line.maxQuantity}
                  value={line.quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setCart(setLineQuantity(line.listingId, Number.isFinite(q) ? q : 1));
                  }}
                  className="h-10 w-16 rounded-lg border border-input bg-background px-2 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCart(removeLine(line.listingId))}>
                Remover
              </Button>
            </div>
            <div className="text-right font-mono text-sm font-medium tabular-nums sm:min-w-[6rem]">
              {formatBrl(line.unitPrice * line.quantity)}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Subtotal (demo)</p>
          <p className="font-serif text-2xl font-medium tabular-nums">{formatBrl(total)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }))}>
            Continuar para o checkout
          </Link>
          <Link href="/loja" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Adicionar mais peças
          </Link>
        </div>
      </div>
    </div>
  );
}
