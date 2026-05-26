import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutClient } from "@/components/loja/checkout-client";
import { dashboardPathForRole } from "@/lib/auth-types";
import { getSession } from "@/lib/session";
import { hideDemoCredentialsUi } from "@/lib/deployment-env";
import { isStripeLiveMode, stripePaymentsConfigured } from "@/lib/stripe-server";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Finalizar compra",
  description: `Finalizar compra — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const session = await getSession();
  const dashboardHref = session ? dashboardPathForRole(session.role) : "/loja";
  const stripeEnabled = stripePaymentsConfigured();
  const stripeLive = isStripeLiveMode();
  const hideDemoUi = hideDemoCredentialsUi();

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
        <span className="text-foreground">Finalizar compra</span>
      </nav>

      <header className="mt-8 space-y-2 border-b border-border/60 pb-8">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Finalizar compra</h1>
        <p className="max-w-2xl text-pretty text-muted-foreground leading-relaxed">
          {session
            ? `Olá, ${session.name ?? session.email}. Informe o endereço de entrega, confira o frete e o total e escolha pagar com cartão (Stripe) ou confirmar sem cartão, conforme as opções exibidas abaixo.`
            : hideDemoUi
              ? "Faça login para vincular este carrinho à sua conta. Ainda não tem cadastro? Crie em “Registrar”."
              : "Faça login para vincular este carrinho à sua conta. Ainda não tem cadastro? Crie em “Registrar” ou, neste ambiente, use a conta de cliente de exemplo indicada ao lado do login."}
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
          stripeEnabled={stripeEnabled}
          stripeLive={stripeLive}
          hideDemoUi={hideDemoUi}
        />
      </div>
    </main>
  );
}
