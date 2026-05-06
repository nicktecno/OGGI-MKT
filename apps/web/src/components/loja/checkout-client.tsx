"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { confirmCheckoutDemoAction } from "@/app/(public)/checkout/checkout-actions";
import { CepLookupButton } from "@/components/address/cep-lookup-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginForm } from "@/components/auth/login-form";
import type { CheckoutDelivery } from "@/lib/checkout-delivery-types";
import { isCheckoutDeliveryComplete } from "@/lib/checkout-delivery-types";
import {
  readCheckoutDelivery,
  readCheckoutDeliveryComplete,
  writeCheckoutDelivery,
} from "@/lib/checkout-delivery-storage";
import type { CartState } from "@/lib/cart-types";
import type { Role } from "@/lib/auth-types";
import { CART_CHANGED_EVENT, cartTotal, clearCart, readCart } from "@/lib/cart-storage";
import { onlyCepDigits } from "@/lib/viacep";
import { cn, formatBrl } from "@/lib/utils";

type Props = {
  session: { email: string; role: Role; name?: string } | null;
  /** Link do painel após pedido (papel atual). */
  dashboardHref: string;
  /** `STRIPE_SECRET_KEY` definido no servidor (modo teste `sk_test_…` ou live). */
  stripeSandbox: boolean;
};

function emptyDelivery(): Partial<CheckoutDelivery> {
  return {
    recipientName: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    uf: "",
  };
}

function mergeDelivery(
  base: Partial<CheckoutDelivery>,
  patch: Partial<CheckoutDelivery>,
): Partial<CheckoutDelivery> {
  return { ...base, ...patch };
}

export function CheckoutClient({ session, dashboardHref, stripeSandbox }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({ version: 1, lines: [] });
  const [done, setDone] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [step, setStep] = useState<"address" | "pay">("address");
  const [delivery, setDelivery] = useState<Partial<CheckoutDelivery>>(emptyDelivery);

  useEffect(() => {
    function sync() {
      setCart(readCart());
    }
    sync();
    window.addEventListener(CART_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CART_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!session) return;
    const saved = readCheckoutDelivery();
    setDelivery(mergeDelivery(emptyDelivery(), saved ?? {}));
    if (readCheckoutDeliveryComplete()) {
      setStep("pay");
    } else {
      setStep("address");
    }
  }, [session]);

  if (done) {
    return (
      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Pedido concluído</CardTitle>
          <CardDescription>
            Obrigado, {session?.name ?? session?.email}. O estoque da vitrine foi atualizado e o
            carrinho foi esvaziado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/loja" className={cn(buttonVariants())}>
            Voltar à loja
          </Link>
          {session?.role === "CUSTOMER" ? (
            <Link href="/loja" className={cn(buttonVariants({ variant: "outline" }))}>
              Continuar na loja
            </Link>
          ) : (
            <Link href={dashboardHref} className={cn(buttonVariants({ variant: "outline" }))}>
              Ir ao painel
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Carrinho vazio</CardTitle>
          <CardDescription>Adicione uma peça antes de finalizar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/loja" className={cn(buttonVariants())}>
            Ir à vitrine
          </Link>
        </CardContent>
      </Card>
    );
  }

  const total = cartTotal(cart);

  if (!session) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-start">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Resumo do pedido</CardTitle>
            <CardDescription>
              Você pode revisar os itens à esquerda. Para vincular o pedido à sua conta, entre
              abaixo — após o login você continua no checkout (entrega e pagamento).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="divide-y divide-border rounded-lg border border-border/80">
              {cart.lines.map((l) => (
                <li key={l.listingId} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <span className="min-w-0 text-foreground">
                    <span className="font-medium">{l.productName}</span>
                    <span className="block text-muted-foreground">
                      {l.quantity}× {formatBrl(l.unitPrice)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">
                    {formatBrl(l.unitPrice * l.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-right font-serif text-xl font-medium tabular-nums">
              Total {formatBrl(total)}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <LoginForm redirectTo="/checkout" />
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/entrar?next=/checkout" className="underline-offset-4 hover:underline">
              Abrir login em página cheia
            </Link>
          </p>
          <div
            id="conta-demo"
            className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground"
          >
            <p className="font-medium text-foreground">Primeira compra / conta demo</p>
            <p className="mt-2">
              Não há cadastro separado neste MVP: use a conta cliente{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">cliente@demo.local</code>{" "}
              e a senha <code className="rounded bg-muted px-1">Demo#2026</code>. O carrinho no
              navegador é mantido após entrar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function onDeliveryField<K extends keyof CheckoutDelivery>(key: K, value: string) {
    setDelivery((prev) => ({ ...prev, [key]: value }));
  }

  function onContinueToPay() {
    setDemoError(null);
    if (!isCheckoutDeliveryComplete(delivery)) {
      setDemoError("Preencha todos os campos obrigatórios de entrega (UF com 2 letras, CEP com 8 dígitos).");
      return;
    }
    writeCheckoutDelivery(delivery);
    setStep("pay");
  }

  const deliveryComplete = readCheckoutDeliveryComplete();
  const showAddressStep = step === "address";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ol className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <li className={cn(showAddressStep && "font-medium text-foreground")}>
          <span className="tabular-nums">1.</span> Entrega
        </li>
        <li aria-hidden="true">
          →
        </li>
        <li className={cn(!showAddressStep && "font-medium text-foreground")}>
          <span className="tabular-nums">2.</span> Revisão e pagamento
        </li>
      </ol>

      {showAddressStep ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,20rem)]">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Endereço de entrega</CardTitle>
              <CardDescription>
                Usado para envio da peça após a costureira postar. Os dados ficam neste aparelho até
                concluir o pedido.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="cd-nome">Nome completo</Label>
                <Input
                  id="cd-nome"
                  value={delivery.recipientName ?? ""}
                  onChange={(e) => onDeliveryField("recipientName", e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cd-tel">Telefone / WhatsApp</Label>
                <Input
                  id="cd-tel"
                  value={delivery.phone ?? ""}
                  onChange={(e) => onDeliveryField("phone", e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cd-cep">CEP</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <Input
                    id="cd-cep"
                    className="sm:max-w-[14rem]"
                    value={delivery.cep ?? ""}
                    onChange={(e) => onDeliveryField("cep", e.target.value)}
                    autoComplete="postal-code"
                    placeholder="00000-000"
                  />
                  <CepLookupButton
                    cep={delivery.cep ?? ""}
                    onFill={(v) => {
                      setDelivery((prev) => ({
                        ...prev,
                        cep: onlyCepDigits(v.cep),
                        street: v.logradouro || prev.street,
                        neighborhood: v.bairro || prev.neighborhood,
                        city: v.localidade || prev.city,
                        uf: (v.uf || prev.uf || "").slice(0, 2).toUpperCase(),
                        complement: v.complemento || prev.complement,
                      }));
                    }}
                  />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="cd-rua">Rua / logradouro</Label>
                <Input
                  id="cd-rua"
                  value={delivery.street ?? ""}
                  onChange={(e) => onDeliveryField("street", e.target.value)}
                  autoComplete="street-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cd-num">Número</Label>
                <Input
                  id="cd-num"
                  value={delivery.number ?? ""}
                  onChange={(e) => onDeliveryField("number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cd-comp">Complemento (opcional)</Label>
                <Input
                  id="cd-comp"
                  value={delivery.complement ?? ""}
                  onChange={(e) => onDeliveryField("complement", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cd-bairro">Bairro</Label>
                <Input
                  id="cd-bairro"
                  value={delivery.neighborhood ?? ""}
                  onChange={(e) => onDeliveryField("neighborhood", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cd-cidade">Cidade</Label>
                <Input
                  id="cd-cidade"
                  value={delivery.city ?? ""}
                  onChange={(e) => onDeliveryField("city", e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cd-uf">UF</Label>
                <Input
                  id="cd-uf"
                  maxLength={2}
                  className="uppercase"
                  value={delivery.uf ?? ""}
                  onChange={(e) => onDeliveryField("uf", e.target.value.toUpperCase())}
                  autoComplete="address-level1"
                />
              </div>
              {demoError ? (
                <p className="sm:col-span-2 text-sm text-destructive" role="alert">
                  {demoError}
                </p>
              ) : null}
              <div className="sm:col-span-2">
                <Button type="button" size="lg" onClick={onContinueToPay}>
                  Continuar para revisão e pagamento
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit border-border/80">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {cart.lines.map((l) => (
                <div key={l.listingId} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">{l.productName}</span>
                  <span className="shrink-0 font-mono tabular-nums">{formatBrl(l.unitPrice * l.quantity)}</span>
                </div>
              ))}
              <p className="border-t border-border pt-2 text-right font-serif text-lg font-medium tabular-nums">
                {formatBrl(total)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="font-serif text-xl">Entrega</CardTitle>
                <CardDescription>
                  {deliveryComplete?.recipientName} · {deliveryComplete?.phone}
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setStep("address")}>
                Editar entrega
              </Button>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              <p>
                {deliveryComplete?.street}, {deliveryComplete?.number}
                {deliveryComplete?.complement ? ` — ${deliveryComplete.complement}` : ""}
              </p>
              <p>
                {deliveryComplete?.neighborhood} — {deliveryComplete?.city}/{deliveryComplete?.uf} · CEP{" "}
                {deliveryComplete?.cep}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Confirmar pedido</CardTitle>
              <CardDescription>
                Conta: <span className="font-medium text-foreground">{session.email}</span>. Itens no
                carrinho deste dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y divide-border text-sm">
                {cart.lines.map((l) => (
                  <li key={l.listingId} className="flex justify-between gap-4 py-2">
                    <span>
                      {l.productName} × {l.quantity}
                    </span>
                    <span className="font-mono tabular-nums">{formatBrl(l.unitPrice * l.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-right font-serif text-xl font-medium tabular-nums">Total {formatBrl(total)}</p>

              {stripeSandbox && session.role === "CUSTOMER" ? (
                <div className="space-y-2 rounded-lg border border-border/80 bg-muted/15 p-4">
                  <p className="text-sm font-medium text-foreground">Pagar com Stripe (sandbox)</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Abre o checkout seguro da Stripe em modo teste. Após o pagamento, o estoque é
                    baixado automaticamente. Use cartões de teste (ex.: 4242…).
                  </p>
                  {stripeError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {stripeError}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    size="lg"
                    disabled={stripeLoading}
                    onClick={() => {
                      setStripeError(null);
                      setStripeLoading(true);
                      void (async () => {
                        try {
                          const res = await fetch("/api/checkout/stripe-session", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ lines: cart.lines }),
                          });
                          const data = (await res.json()) as { url?: string; error?: string };
                          if (!res.ok) {
                            setStripeError(data.error ?? "Não foi possível iniciar o pagamento.");
                            return;
                          }
                          if (data.url) {
                            window.location.href = data.url;
                            return;
                          }
                          setStripeError("Resposta inválida do servidor.");
                        } catch {
                          setStripeError("Erro de rede. Tente de novo.");
                        } finally {
                          setStripeLoading(false);
                        }
                      })();
                    }}
                  >
                    {stripeLoading ? "Redirecionando…" : "Pagar com Stripe (teste)"}
                  </Button>
                </div>
              ) : null}

              {demoError ? (
                <p className="text-sm text-destructive" role="alert">
                  {demoError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  variant={stripeSandbox && session.role === "CUSTOMER" ? "outline" : "default"}
                  disabled={demoLoading}
                  onClick={() => {
                    setDemoError(null);
                    const d = readCheckoutDeliveryComplete();
                    if (!d) {
                      setDemoError("Dados de entrega incompletos. Volte ao passo anterior.");
                      setStep("address");
                      return;
                    }
                    setDemoLoading(true);
                    void (async () => {
                      try {
                        const res = await confirmCheckoutDemoAction(cart.lines, d);
                        if (!res.ok) {
                          setDemoError(res.error);
                          return;
                        }
                        clearCart();
                        setDone(true);
                        router.refresh();
                      } catch {
                        setDemoError("Erro ao finalizar. Tente de novo.");
                      } finally {
                        setDemoLoading(false);
                      }
                    })();
                  }}
                >
                  {demoLoading ? "Processando…" : "Confirmar pedido (demo, sem gateway)"}
                </Button>
                <Link href="/carrinho" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Editar carrinho
                </Link>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O fluxo demo confirma o pedido no servidor, baixa o estoque da oferta e esvazia o
                carrinho. O Stripe em teste faz o pagamento e, na página de obrigado, aplica a mesma
                baixa de estoque.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
