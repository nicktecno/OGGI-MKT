"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CapacityBar } from "@/components/loslos-fest/capacity-bar";
import { TemplateLinesModal } from "@/components/loslos-fest/template-lines-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOSLOS_FEST_MIN_ORDER_BRL } from "@/lib/loslos-fest/constants";
import {
  applyFestLines,
  applyFestTemplate,
  festOrderMeetsMinimum,
  festOrderRemainingUnits,
  festOrderSubtotal,
  festOrderUnitCount,
  readFestOrder,
  setFestLine,
  writeFestOrder,
  FEST_CART_CHANGED_EVENT,
} from "@/lib/loslos-fest/cart-storage";
import { buildLinesFromTemplate } from "@/lib/loslos-fest/catalog-helpers";
import { useFestCatalog } from "@/lib/loslos-fest/use-fest-catalog";
import type { FestCartModel, FestOrderDraft, FestTemplate } from "@/lib/loslos-fest/types";
import { cn, formatBrl } from "@/lib/utils";
import { Eye, Minus, Plus, Sparkles } from "lucide-react";

type Tab = "templates" | "manual";

type Props = {
  cartModel: FestCartModel;
};

export function FestConfigurator({ cartModel }: Props) {
  const router = useRouter();
  const catalog = useFestCatalog();
  const { lines: iceCreamLines, templates: festTemplates } = catalog;
  const [tab, setTab] = useState<Tab>("templates");
  const [order, setOrder] = useState<FestOrderDraft | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<FestTemplate | null>(null);

  useEffect(() => {
    const existing = readFestOrder();
    if (existing?.cartModelId === cartModel.id) {
      setOrder(existing);
      setEventDate(existing.eventDate ?? "");
    } else {
      const draft: FestOrderDraft = {
        version: 1,
        cartModelId: cartModel.id,
        cartModelSlug: cartModel.slug,
        cartModelName: cartModel.name,
        capacity: cartModel.capacity,
        lines: [],
        addOns: [],
      };
      setOrder(draft);
      writeFestOrder(draft);
    }
    const onChange = () => {
      const o = readFestOrder();
      if (o?.cartModelId === cartModel.id) setOrder(o);
    };
    window.addEventListener(FEST_CART_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(FEST_CART_CHANGED_EVENT, onChange);
  }, [cartModel.id, cartModel.slug, cartModel.name, cartModel.capacity]);

  const filled = order ? festOrderUnitCount(order) : 0;
  const subtotal = order ? festOrderSubtotal(order) : 0;
  const meetsMin = order ? festOrderMeetsMinimum(order) : false;
  const isFull = order ? filled === order.capacity : false;

  const persist = useCallback((next: FestOrderDraft) => {
    const withDate = { ...next, eventDate: eventDate || next.eventDate };
    setOrder(withDate);
    writeFestOrder(withDate);
  }, [eventDate]);

  const applyTemplateHandler = (tpl: FestTemplate) => {
    if (!order) return;
    const lines = buildLinesFromTemplate(catalog, tpl, cartModel.capacity);
    const next = applyFestTemplate(order, tpl.id, tpl.name, lines);
    persist(next);
    setTab("manual");
  };

  const setQuantity = (lineId: string, delta: number) => {
    if (!order) return;
    const meta = iceCreamLines.find((l) => l.id === lineId);
    if (!meta) return;
    const current = order.lines.find((l) => l.lineId === lineId)?.quantity ?? 0;
    const remaining = festOrderRemainingUnits(order);
    const nextQty =
      delta > 0 ? Math.min(current + delta, current + remaining) : Math.max(0, current + delta);
    const next = setFestLine(order, {
      lineId: meta.id,
      lineName: meta.name,
      unitPrice: meta.unitPrice,
      quantity: nextQty,
      imageUrl: meta.imageUrl,
    });
    persist(applyFestLines(next, next.lines));
  };

  const lineQtyMap = useMemo(() => {
    const m = new Map<string, number>();
    order?.lines.forEach((l) => m.set(l.lineId, l.quantity));
    return m;
  }, [order?.lines]);

  if (!order) {
    return <p className="text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <div className="flex gap-2 rounded-full border-2 border-primary/20 bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("templates")}
            className={cn(
              "flex-1 rounded-full px-4 py-3 text-xs font-extrabold uppercase tracking-wider transition-colors",
              tab === "templates"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-primary hover:bg-card/80",
            )}
          >
            Modelos prontos
          </button>
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={cn(
              "flex-1 rounded-full px-4 py-3 text-xs font-extrabold uppercase tracking-wider transition-colors",
              tab === "manual"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-primary hover:bg-card/80",
            )}
          >
            Montar manualmente
          </button>
        </div>

        {tab === "templates" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {festTemplates.map((tpl) => (
              <Card
                key={tpl.id}
                className="overflow-hidden border-2 border-primary/15 transition hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={tpl.imageUrl}
                    alt={tpl.name}
                    fill
                    className="object-cover object-center"
                    sizes="400px"
                  />
                  {tpl.featured ? (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ffc72c] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-[#2d2d2d]">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      Popular
                    </span>
                  ) : null}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base font-extrabold uppercase tracking-wide text-primary">
                    {tpl.name}
                  </CardTitle>
                  <CardDescription>{tpl.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full border-2 border-primary font-bold uppercase tracking-wide text-primary hover:bg-muted"
                    onClick={() => setPreviewTemplate(tpl)}
                  >
                    <Eye className="mr-2 h-4 w-4" aria-hidden />
                    Ver linhas do modelo
                  </Button>
                  <Button type="button" className="w-full" onClick={() => applyTemplateHandler(tpl)}>
                    Usar este modelo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {order.templateName ? (
              <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
                Modelo aplicado: <strong>{order.templateName}</strong>. Ajuste as quantidades abaixo.
              </p>
            ) : null}
            <ul className="space-y-3">
              {iceCreamLines.map((line) => {
                const qty = lineQtyMap.get(line.id) ?? 0;
                const canAdd = festOrderRemainingUnits(order) > 0;
                return (
                  <li
                    key={line.id}
                    className="flex flex-col gap-4 rounded-2xl border-2 border-primary/15 bg-card p-4 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
                      <Image src={line.imageUrl} alt="" fill className="object-contain p-1" sizes="112px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-sm font-extrabold uppercase tracking-wide text-primary">
                        {line.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{line.description}</p>
                      <p className="mt-1 text-sm font-bold text-primary">
                        {formatBrl(line.unitPrice)} / un.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={qty === 0}
                        onClick={() => setQuantity(line.id, -1)}
                        aria-label={`Menos ${line.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={!canAdd}
                        onClick={() => setQuantity(line.id, 1)}
                        aria-label={`Mais ${line.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="event-date">Data do evento (opcional neste passo)</Label>
          <Input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => {
              setEventDate(e.target.value);
              persist({ ...order, eventDate: e.target.value });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Recomendamos solicitar com 15 a 10 dias de antecedência.
          </p>
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
          <div className="bg-primary px-6 py-4 text-primary-foreground">
            <CardTitle className="font-heading text-lg font-extrabold uppercase">{cartModel.name}</CardTitle>
            <CardDescription className="text-primary-foreground/85">
              Capacidade {cartModel.capacity} picolés
            </CardDescription>
          </div>
          <CardHeader className="sr-only">
            <CardTitle>{cartModel.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <CapacityBar filled={filled} capacity={order.capacity} />
            <div className="space-y-1 border-t border-border/60 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal produtos</span>
                <span className="font-semibold">{formatBrl(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locação do carrinho</span>
                <span className="text-accent font-medium">
                  {meetsMin ? "Grátis" : "Incluída acima de " + formatBrl(LOSLOS_FEST_MIN_ORDER_BRL)}
                </span>
              </div>
            </div>
            {!meetsMin && isFull ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Pedido mínimo de {formatBrl(LOSLOS_FEST_MIN_ORDER_BRL)} em sorvetes Los Los. Ajuste as linhas ou
                escolha sabores com valor unitário maior.
              </p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={!isFull || !meetsMin}
              onClick={() => router.push("/carrinho")}
            >
              Ir para o carrinho
            </Button>
            <Link
              href="/fest"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
            >
              Trocar tamanho do carrinho
            </Link>
          </CardContent>
        </Card>
      </aside>

      <TemplateLinesModal
        open={previewTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
        template={previewTemplate}
        capacity={cartModel.capacity}
        catalog={catalog}
      />
    </div>
  );
}
