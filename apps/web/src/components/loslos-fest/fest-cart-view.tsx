"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CapacityBar } from "@/components/loslos-fest/capacity-bar";
import { FestAddOnsSection } from "@/components/loslos-fest/fest-add-ons-section";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  clearFestOrder,
  festOrderAddOnsSubtotal,
  festOrderGrandTotal,
  festOrderMeetsMinimum,
  festOrderSubtotal,
  festOrderUnitCount,
  readFestOrder,
  FEST_CART_CHANGED_EVENT,
} from "@/lib/loslos-fest/cart-storage";
import { LOSLOS_FEST_DEPOSIT_PERCENT, LOSLOS_FEST_MIN_ORDER_BRL } from "@/lib/loslos-fest/constants";
import type { FestOrderDraft } from "@/lib/loslos-fest/types";
import { cn, formatBrl } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export function FestCartView() {
  const [order, setOrder] = useState<FestOrderDraft | null>(null);

  useEffect(() => {
    function sync() {
      setOrder(readFestOrder());
    }
    sync();
    window.addEventListener(FEST_CART_CHANGED_EVENT, sync);
    return () => window.removeEventListener(FEST_CART_CHANGED_EVENT, sync);
  }, []);

  if (!order || order.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center">
        <p className="text-lg font-medium text-foreground">Seu carrinho Los Los Fest está vazio</p>
        <p className="mt-2 text-muted-foreground">
          Escolha um carrinho de 200 ou 300 unidades e monte seu pedido com modelos ou linhas de sorvete.
        </p>
        <Link href="/fest" className={cn(buttonVariants({ size: "lg" }), "mt-8 inline-flex")}>
          Montar meu Los Los Fest
        </Link>
      </div>
    );
  }

  const filled = festOrderUnitCount(order);
  const subtotal = festOrderSubtotal(order);
  const addOnsSubtotal = festOrderAddOnsSubtotal(order);
  const grandTotal = festOrderGrandTotal(order);
  const meetsMin = festOrderMeetsMinimum(order);
  const deposit = (grandTotal * LOSLOS_FEST_DEPOSIT_PERCENT) / 100;
  const isFull = filled === order.capacity;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border/60 bg-card/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-medium">{order.cartModelName}</h2>
            {order.templateName ? (
              <p className="mt-1 text-sm text-muted-foreground">Modelo: {order.templateName}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Montagem personalizada</p>
            )}
            {order.eventDate ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Evento em{" "}
                {new Date(order.eventDate + "T12:00:00").toLocaleDateString("pt-BR", {
                  dateStyle: "long",
                })}
              </p>
            ) : null}
          </div>
          <Link
            href={`/fest/${order.cartModelSlug}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Editar composição
          </Link>
        </div>
        <div className="mt-6">
          <CapacityBar filled={filled} capacity={order.capacity} />
        </div>
      </div>

      <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/80">
        {order.lines
          .filter((l) => l.quantity > 0)
          .map((line) => (
            <li key={line.lineId} className="flex items-center gap-4 p-4">
              {line.imageUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <Image src={line.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{line.lineName}</p>
                <p className="text-sm text-muted-foreground">
                  {line.quantity} un. × {formatBrl(line.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">
                {formatBrl(line.unitPrice * line.quantity)}
              </p>
            </li>
          ))}
      </ul>

      {order.addOns.length > 0 ? (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/80">
          {order.addOns.map((addOn) => (
            <li key={addOn.productId} className="flex items-center gap-4 p-4">
              {addOn.imageUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <Image src={addOn.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{addOn.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {addOn.quantity} un. × {formatBrl(addOn.unitPrice)} · complementar
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">
                {formatBrl(addOn.unitPrice * addOn.quantity)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <FestAddOnsSection order={order} onOrderChange={setOrder} />

      <div className="rounded-xl border border-border/60 bg-muted/25 p-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal em picolés</span>
          <span className="font-semibold">{formatBrl(subtotal)}</span>
        </div>
        {addOnsSubtotal > 0 ? (
          <div className="flex justify-between">
            <span>Itens complementares</span>
            <span className="font-semibold">{formatBrl(addOnsSubtotal)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-medium border-t border-border/60 pt-3">
          <span>Total em produtos</span>
          <span>{formatBrl(grandTotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Locação do carrinho (acima de {formatBrl(LOSLOS_FEST_MIN_ORDER_BRL)})</span>
          <span className="text-accent font-medium">{meetsMin ? "Sem custo" : "—"}</span>
        </div>
        <div className="flex justify-between border-t border-border/60 pt-3 font-medium">
          <span>Sinal para reserva ({LOSLOS_FEST_DEPOSIT_PERCENT}%)</span>
          <span>{formatBrl(deposit)}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Mock front-end: confirmação real será feita pela loja após pagamento do sinal. Transporte do
          carrinho por conta do contratante (entrega opcional com orçamento à parte).
        </p>
      </div>

      {!isFull || !meetsMin ? (
        <p className="text-sm text-destructive">
          {!isFull
            ? `Complete ${order.capacity - filled} unidades no carrinho.`
            : `Valor mínimo de ${formatBrl(LOSLOS_FEST_MIN_ORDER_BRL)} em produtos.`}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/checkout"
          className={cn(
            buttonVariants({ size: "lg" }),
            (!isFull || !meetsMin) && "pointer-events-none opacity-50",
          )}
          aria-disabled={!isFull || !meetsMin}
        >
          Finalizar pedido
        </Link>
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => {
            clearFestOrder();
            setOrder(null);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar pedido
        </Button>
      </div>
    </div>
  );
}
