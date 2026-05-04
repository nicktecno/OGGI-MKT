"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import type { CartState } from "@/lib/cart-types";
import type { Role } from "@/lib/auth-types";
import { CART_CHANGED_EVENT, cartTotal, clearCart, readCart } from "@/lib/cart-storage";
import { cn, formatBrl } from "@/lib/utils";

type Props = {
  session: { email: string; role: Role; name?: string } | null;
  /** Link do painel após pedido (papel atual). */
  dashboardHref: string;
  /** `STRIPE_SECRET_KEY` definido no servidor (modo teste `sk_test_…` ou live). */
  stripeSandbox: boolean;
};

export function CheckoutClient({ session, dashboardHref, stripeSandbox }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({ version: 1, lines: [] });
  const [done, setDone] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      setCart(readCart());
    }
    sync();
    window.addEventListener(CART_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CART_CHANGED_EVENT, sync);
  }, []);

  if (done) {
    return (
      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Pedido registrado (demo)</CardTitle>
          <CardDescription>
            Obrigado, {session?.name ?? session?.email}. Este MVP não processa pagamento; o fluxo
            de carrinho + login foi concluído.
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
              abaixo — após o login você volta automaticamente para este checkout.
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
          <div id="conta-demo" className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Primeira compra / conta demo</p>
            <p className="mt-2">
              Não há cadastro separado neste MVP: use a conta cliente{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">cliente@demo.local</code>{" "}
              e a senha <code className="rounded bg-muted px-1">Demo#2026</code>. O carrinho no
              navegador é mantido após entrar e fica vinculado ao fluxo de checkout.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Confirmar pedido</CardTitle>
          <CardDescription>
            Conta: <span className="font-medium text-foreground">{session.email}</span>. Os itens
            abaixo estão no seu carrinho neste dispositivo.
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
                Abre o checkout seguro da Stripe em modo teste. Use cartões de teste do painel Stripe
                (ex.: 4242…).
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
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="lg"
              variant={stripeSandbox && session.role === "CUSTOMER" ? "outline" : "default"}
              onClick={() => {
                clearCart();
                setDone(true);
                router.refresh();
              }}
            >
              Confirmar sem pagamento (demo)
            </Button>
            <Link href="/carrinho" className={cn(buttonVariants({ variant: "outline" }))}>
              Editar carrinho
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
