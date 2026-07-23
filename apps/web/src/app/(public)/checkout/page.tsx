import type { Metadata } from "next";
import Link from "next/link";
import { FestCheckoutClient } from "@/components/loslos-fest/fest-checkout-client";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: `Retirada ou entrega — ${SITE_NAME}.`,
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>
        <span className="mx-2 text-border">/</span>
        <Link href="/carrinho" className="hover:text-foreground">
          Meu pedido
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">Finalizar</span>
      </nav>

      <header className="mt-8 space-y-2 border-b border-border/60 pb-8">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Finalizar pedido</h1>
        <p className="max-w-2xl text-pretty text-muted-foreground leading-relaxed">
          Escolha retirar o carrinho na loja Loslos ou receber no local do evento. Fluxo mockado — em
          produção a loja confirmará após o sinal de 50%.
        </p>
      </header>

      <div className="mt-10">
        <FestCheckoutClient />
      </div>
    </main>
  );
}
