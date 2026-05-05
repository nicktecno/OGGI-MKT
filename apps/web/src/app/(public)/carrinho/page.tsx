import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CarrinhoView } from "@/components/loja/carrinho-view";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carrinho",
  description: `Carrinho — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default function CarrinhoPage() {
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
          Revise os itens e siga para o checkout. Lá você entra (ou usa a conta demo) para vincular o
          pedido à sua sessão — pagamento ainda não está integrado neste MVP.
        </p>
        <Link href="/checkout" className={cn(buttonVariants(), "mt-4 inline-flex w-fit")}>
          Ir ao checkout
        </Link>
      </header>

      <div className="mt-10">
        <CarrinhoView />
      </div>
    </main>
  );
}
