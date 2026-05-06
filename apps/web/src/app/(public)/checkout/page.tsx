import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutClient } from "@/components/loja/checkout-client";
import { dashboardPathForRole } from "@/lib/auth-types";
import { getSession } from "@/lib/session";
import { stripePaymentsConfigured } from "@/lib/stripe-server";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Checkout",
  description: `Checkout — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const session = await getSession();
  const dashboardHref = session ? dashboardPathForRole(session.role) : "/loja";
  const stripeSandbox = stripePaymentsConfigured();

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>
        <span className="mx-2 text-border">/</span>
        <Link href="/loja" className="hover:text-foreground">
          Loja
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">Checkout</span>
      </nav>

      <header className="mt-8 space-y-2 border-b border-border/60 pb-8">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Checkout</h1>
        <p className="max-w-2xl text-pretty text-muted-foreground leading-relaxed">
          {session
            ? `Olá, ${session.name ?? session.email}. Informe o endereço de entrega, revise o carrinho e escolha pagamento com Stripe (teste) ou confirmação demo.`
            : "Faça login para vincular este carrinho à sua conta. Novo por aqui? Use a conta cliente demo indicada ao lado do formulário."}
        </p>
      </header>

      <div className="mt-10">
        <CheckoutClient
          session={
            session
              ? { email: session.email, role: session.role, name: session.name }
              : null
          }
          dashboardHref={dashboardHref}
          stripeSandbox={stripeSandbox}
        />
      </div>
    </main>
  );
}
