"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FestAddOnUpsellModal } from "@/components/oggi-fest/fest-add-on-upsell-modal";
import { FestAddOnsSection } from "@/components/oggi-fest/fest-add-ons-section";
import { FestNearestStoreCepModal } from "@/components/oggi-fest/fest-nearest-store-cep-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearFestOrder,
  festOrderAddOnsSubtotal,
  festOrderGrandTotal,
  festOrderMeetsMinimum,
  festOrderSubtotal,
  festOrderUnitCount,
  readFestOrder,
  setFestAddOn,
  setFestCustomerCep,
  writeFestOrder,
} from "@/lib/oggi-fest/cart-storage";
import { OGGI_FEST_DEPOSIT_PERCENT, OGGI_FEST_MIN_ORDER_BRL } from "@/lib/oggi-fest/constants";
import { clearFestCheckout, readFestCheckout, writeFestCheckout } from "@/lib/oggi-fest/checkout-storage";
import { getCheckoutUpsellProducts } from "@/lib/oggi-fest/mock-data";
import {
  findNearestStore,
  formatCepDisplay,
  rankStoresByCep,
  resolveCustomerCep,
  storeDirectionsUrl,
} from "@/lib/oggi-fest/nearest-store";
import { useFestCatalog } from "@/lib/oggi-fest/use-fest-catalog";
import type { FestAddOnProduct, FestCheckoutDraft, FestDeliveryMode, FestOrderDraft, OggiStore } from "@/lib/oggi-fest/types";
import { cn, formatBrl } from "@/lib/utils";
import { MapPin, Package, Store } from "lucide-react";

const MOCK_DELIVERY_FEE = 89.9;

export function FestCheckoutClient() {
  const { stores: oggiStores } = useFestCatalog();
  const [order, setOrder] = useState(readFestOrder());
  const [done, setDone] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<FestDeliveryMode>("retirada");
  const [storeId, setStoreId] = useState("");
  const [form, setForm] = useState<Partial<FestCheckoutDraft>>({});
  const [upsellQueue, setUpsellQueue] = useState<FestAddOnProduct[]>([]);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [cepModalOpen, setCepModalOpen] = useState(false);
  const [finalizedStore, setFinalizedStore] = useState<OggiStore | null>(null);
  const [finalizedCep, setFinalizedCep] = useState("");

  useEffect(() => {
    const saved = readFestCheckout();
    if (saved) {
      setDeliveryMode(saved.deliveryMode);
      setStoreId(saved.storeId ?? "");
      setForm(saved);
    }
    setOrder(readFestOrder());
  }, []);

  useEffect(() => {
    if (oggiStores.length === 0) return;
    setStoreId((prev) => (prev && oggiStores.some((s) => s.id === prev) ? prev : oggiStores[0].id));
  }, [oggiStores]);

  useEffect(() => {
    if (oggiStores.length === 0 || !order?.customerCep) return;
    const nearest = findNearestStore(oggiStores, order.customerCep);
    if (nearest) setStoreId(nearest.id);
  }, [oggiStores, order?.customerCep]);

  if (!order || order.lines.length === 0) {
    return (
      <p className="text-muted-foreground">
        Nenhum pedido em andamento.{" "}
        <Link href="/fest" className="font-medium text-accent underline-offset-4 hover:underline">
          Montar Los Los Fest
        </Link>
      </p>
    );
  }

  const subtotal = festOrderSubtotal(order);
  const addOnsSubtotal = festOrderAddOnsSubtotal(order);
  const productsTotal = festOrderGrandTotal(order);
  const filled = festOrderUnitCount(order);
  const meetsMin = festOrderMeetsMinimum(order);
  const isFull = filled === order.capacity;
  const deposit = (productsTotal * OGGI_FEST_DEPOSIT_PERCENT) / 100;
  const deliveryFee = deliveryMode === "entrega" ? MOCK_DELIVERY_FEE : 0;
  const totalMock = productsTotal + deliveryFee;
  const currentUpsell = upsellQueue[0] ?? null;
  const customerCep = resolveCustomerCep(order.customerCep, form.cep);
  const rankedStores =
    customerCep.length === 8 ? rankStoresByCep(oggiStores, customerCep) : oggiStores;
  const nearestStore =
    customerCep.length === 8 ? findNearestStore(oggiStores, customerCep) : null;

  const patch = (p: Partial<FestCheckoutDraft>) => setForm((f) => ({ ...f, ...p }));

  function buildCheckoutDraft(current: FestOrderDraft, cepOverride?: string): FestCheckoutDraft {
    const cep = cepOverride ?? resolveCustomerCep(current.customerCep, form.cep);
    const nearest = cep.length === 8 ? findNearestStore(oggiStores, cep) : null;
    const selectedId =
      deliveryMode === "retirada" ? (nearest?.id ?? storeId) : nearest?.id ?? storeId;
    const selectedStore = oggiStores.find((s) => s.id === selectedId) ?? nearest;
    return {
      version: 1,
      deliveryMode,
      storeId: selectedStore?.id,
      storeName: selectedStore?.name,
      recipientName: form.recipientName ?? "",
      phone: form.phone ?? "",
      cep: deliveryMode === "entrega" ? (form.cep ?? cep) : cep,
      street: form.street ?? "",
      number: form.number ?? "",
      complement: form.complement ?? "",
      neighborhood: form.neighborhood ?? "",
      city: form.city ?? "",
      uf: form.uf ?? "",
      eventDate: form.eventDate ?? current.eventDate ?? "",
    };
  }

  function finalizeOrder(currentOrder?: FestOrderDraft) {
    const active = currentOrder ?? order;
    if (!active) return;
    const cep = resolveCustomerCep(active.customerCep, form.cep);
    const ranked = cep.length === 8 ? rankStoresByCep(oggiStores, cep) : oggiStores;
    const selected =
      ranked.find((s) => s.id === storeId) ??
      (cep.length === 8 ? findNearestStore(oggiStores, cep) : oggiStores.find((s) => s.id === storeId));
    if (selected) setFinalizedStore(selected);
    if (cep) setFinalizedCep(cep);
    writeFestCheckout(buildCheckoutDraft(active, cep));
    setDone(true);
    clearFestOrder();
    clearFestCheckout();
    setUpsellOpen(false);
    setUpsellQueue([]);
    setCepModalOpen(false);
  }

  function applyCepAndProceed(cep: string, nearest: OggiStore | null) {
    if (!order) return;
    const next = setFestCustomerCep(order, cep);
    writeFestOrder(next);
    setOrder(next);
    if (nearest) setStoreId(nearest.id);
    setCepModalOpen(false);
    writeFestCheckout(buildCheckoutDraft(next, cep));
    startUpsellFlow(next);
  }

  function proceedAfterUpsell(nextOrder: FestOrderDraft) {
    const remaining = getCheckoutUpsellProducts(nextOrder);
    if (remaining.length === 0) {
      setUpsellOpen(false);
      finalizeOrder();
    } else {
      setUpsellQueue(remaining);
    }
  }

  function startUpsellFlow(current: FestOrderDraft) {
    const pending = getCheckoutUpsellProducts(current);
    if (pending.length === 0) {
      finalizeOrder();
      return;
    }
    setUpsellQueue(pending);
    setUpsellOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !isFull || !meetsMin) return;
    const cep = resolveCustomerCep(order.customerCep, form.cep);
    if (cep.length !== 8) {
      setCepModalOpen(true);
      return;
    }
    applyCepAndProceed(cep, findNearestStore(oggiStores, cep));
  }

  function handleUpsellAdd(quantity: number) {
    if (!order || !currentUpsell) return;
    const next = setFestAddOn(order, currentUpsell, quantity);
    writeFestOrder(next);
    setOrder(next);
    proceedAfterUpsell(next);
  }

  function handleUpsellDecline() {
    if (!order || !currentUpsell) return;
    const remaining = upsellQueue.filter((p) => p.id !== currentUpsell.id);
    if (remaining.length === 0) {
      setUpsellOpen(false);
      finalizeOrder();
    } else {
      setUpsellQueue(remaining);
    }
  }

  if (done) {
    const mapsUrl = finalizedStore ? storeDirectionsUrl(finalizedStore) : null;
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Solicitação enviada (mock)</CardTitle>
          <CardDescription>
            Em produção, a loja retornará em até 48h úteis. O pedido será confirmado após o pagamento de{" "}
            {OGGI_FEST_DEPOSIT_PERCENT}% do orçamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {finalizedStore ? (
            <div className="rounded-xl border border-accent/30 bg-background/80 p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-accent">Loja indicada para retirada</p>
              <p className="font-semibold text-lg">{finalizedStore.name}</p>
              <p className="text-sm text-muted-foreground">
                {finalizedStore.address} — {finalizedStore.city}/{finalizedStore.uf}
              </p>
              {finalizedCep ? (
                <p className="text-sm text-muted-foreground">
                  Com base no CEP {formatCepDisplay(finalizedCep)}
                  {finalizedStore.distanceKm != null ? ` · ~${finalizedStore.distanceKm} km` : ""}
                </p>
              ) : null}
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "inline-flex gap-2")}
                >
                  <MapPin className="h-4 w-4" />
                  Como chegar na loja
                </a>
              ) : null}
            </div>
          ) : null}
          <Link href="/fest" className={cn(buttonVariants())}>
            Novo pedido Los Los Fest
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-medium">Como receber o carrinho?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMode("retirada")}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-colors",
                  deliveryMode === "retirada"
                    ? "border-accent bg-accent/5 ring-2 ring-accent/30"
                    : "border-border/60 hover:border-accent/40",
                )}
              >
                <Store className="h-6 w-6 text-accent" />
                <span className="font-semibold">Retirar na loja</span>
                <span className="text-sm text-muted-foreground">
                  Você retira o carrinho e os produtos na unidade Oggi escolhida.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode("entrega")}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-colors",
                  deliveryMode === "entrega"
                    ? "border-accent bg-accent/5 ring-2 ring-accent/30"
                    : "border-border/60 hover:border-accent/40",
                )}
              >
                <Package className="h-6 w-6 text-accent" />
                <span className="font-semibold">Receber no local do evento</span>
                <span className="text-sm text-muted-foreground">
                  Orçamento de entrega conforme distância (valor mock abaixo).
                </span>
              </button>
            </div>
          </section>

          {deliveryMode === "retirada" ? (
            <section className="space-y-3">
              <div>
                <Label>Loja para retirada</Label>
                {nearestStore ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ordenado pela proximidade do CEP {formatCepDisplay(customerCep)} — mais próxima:{" "}
                    <span className="font-medium text-foreground">{nearestStore.name}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Informe seu CEP ao finalizar para indicarmos a unidade mais próxima.
                  </p>
                )}
              </div>
              <ul className="space-y-2">
                {rankedStores.map((store, index) => (
                  <li key={store.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                        storeId === store.id
                          ? "border-accent bg-accent/5"
                          : "border-border/60 hover:border-accent/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="store"
                        className="mt-1"
                        checked={storeId === store.id}
                        onChange={() => setStoreId(store.id)}
                      />
                      <div>
                        <p className="font-medium">
                          {store.name}
                          {index === 0 && customerCep.length === 8 ? (
                            <span className="ml-2 text-xs font-bold uppercase text-accent">Mais próxima</span>
                          ) : null}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {store.address} — {store.city}/{store.uf}
                        </p>
                        {store.distanceKm != null && customerCep.length === 8 ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-accent">
                            <MapPin className="h-3 w-3" />
                            ~{store.distanceKm} km
                          </p>
                        ) : null}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="recipientName">Nome para contato</Label>
              <Input
                id="recipientName"
                required
                value={form.recipientName ?? ""}
                onChange={(e) => patch({ recipientName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                required
                value={form.phone ?? ""}
                onChange={(e) => patch({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data do evento</Label>
              <Input
                id="eventDate"
                type="date"
                required
                value={form.eventDate ?? order.eventDate ?? ""}
                onChange={(e) => patch({ eventDate: e.target.value })}
              />
            </div>
            {deliveryMode === "entrega" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP do evento</Label>
                  <Input
                    id="cep"
                    required
                    value={form.cep ?? ""}
                    onChange={(e) => patch({ cep: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="street">Endereço</Label>
                  <Input
                    id="street"
                    required
                    value={form.street ?? ""}
                    onChange={(e) => patch({ street: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    required
                    value={form.number ?? ""}
                    onChange={(e) => patch({ number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    required
                    value={form.neighborhood ?? ""}
                    onChange={(e) => patch({ neighborhood: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    required
                    value={form.city ?? ""}
                    onChange={(e) => patch({ city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    required
                    maxLength={2}
                    value={form.uf ?? ""}
                    onChange={(e) => patch({ uf: e.target.value.toUpperCase() })}
                  />
                </div>
              </>
            ) : null}
          </section>

          <FestAddOnsSection order={order} onOrderChange={setOrder} />
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{order.cartModelName}</p>
              <p className="text-muted-foreground">{filled} picolés</p>
              <div className="flex justify-between border-t border-border/60 pt-3">
                <span>Picolés</span>
                <span className="font-semibold">{formatBrl(subtotal)}</span>
              </div>
              {addOnsSubtotal > 0 ? (
                <div className="flex justify-between">
                  <span>Complementares</span>
                  <span className="font-semibold">{formatBrl(addOnsSubtotal)}</span>
                </div>
              ) : null}
              {deliveryMode === "entrega" ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Entrega (mock)</span>
                  <span>{formatBrl(deliveryFee)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-medium">
                <span>Total estimado</span>
                <span>{formatBrl(totalMock)}</span>
              </div>
              <div className="flex justify-between text-accent">
                <span>Sinal ({OGGI_FEST_DEPOSIT_PERCENT}%)</span>
                <span className="font-semibold">{formatBrl(deposit)}</span>
              </div>
              {order.addOns.length > 0 ? (
                <ul className="space-y-1 border-t border-border/60 pt-3 text-muted-foreground">
                  {order.addOns.map((a) => (
                    <li key={a.productId} className="flex justify-between">
                      <span>
                        {a.productName} × {a.quantity}
                      </span>
                      <span>{formatBrl(a.unitPrice * a.quantity)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button
                type="submit"
                className="w-full mt-4"
                size="lg"
                disabled={!isFull || !meetsMin}
              >
                Confirmar solicitação
              </Button>
              <p className="text-xs text-muted-foreground">
                Mínimo {formatBrl(OGGI_FEST_MIN_ORDER_BRL)} em picolés. Pagamento tratado diretamente com a
                loja (mock).
              </p>
            </CardContent>
          </Card>
        </aside>
      </form>

      <FestAddOnUpsellModal
        open={upsellOpen}
        product={currentUpsell}
        onAdd={handleUpsellAdd}
        onDecline={handleUpsellDecline}
      />

      <FestNearestStoreCepModal
        open={cepModalOpen}
        stores={oggiStores}
        initialCep={order.customerCep ?? ""}
        onConfirm={applyCepAndProceed}
        onCancel={() => setCepModalOpen(false)}
      />
    </>
  );
}
