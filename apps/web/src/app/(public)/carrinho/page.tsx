import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CarrinhoView } from "@/components/loja/carrinho-view";
import { hideDemoCredentialsUi } from "@/lib/deployment-env";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carrinho",
  description: `Carrinho — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default function CarrinhoPage() {
  const hideDemoUi = hideDemoCredentialsUi();
  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:px-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>
        <span className="mx-2 text-border">/</span>
        <Link href="/loja" className="hover:text-foreground">
          Loja
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">Carrinho</span>
      </nav>

      <header className="mt-8 space-y-2 border-b border-border/60 pb-8">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Carrinho</h1>
        <p className="max-w-2xl text-pretty text-muted-foreground leading-relaxed">
          {hideDemoUi
            ? "Revise os itens e siga para finalizar a compra. No passo seguinte você informa a entrega, confere o frete e paga pelo checkout do Stripe (cartão, Pix ou outras formas habilitadas na loja)."
            : "Revise os itens e siga para finalizar a compra. Ali você informa a entrega, confere o frete e paga pelo Stripe ou usa a opção de teste sem cobrança — com login de cliente."}
        </p>
        <Link href="/checkout" className={cn(buttonVariants(), "mt-4 inline-flex w-fit")}>
          Finalizar compra
        </Link>
      </header>

      <div className="mt-10">
        <CarrinhoView />
      </div>
    </main>
  );
}
