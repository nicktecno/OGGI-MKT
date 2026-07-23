import type { Metadata } from "next";
import Link from "next/link";
import { FestCartView } from "@/components/loslos-fest/fest-cart-view";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Meu pedido",
  description: `Revise seu pedido Los Los Fest — ${SITE_NAME}.`,
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
        <Link href="/fest" className="hover:text-foreground">
          Los Los Fest
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">Meu pedido</span>
      </nav>

      <header className="mt-8 space-y-2 border-b border-border/60 pb-8">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Meu pedido</h1>
        <p className="max-w-2xl text-pretty text-muted-foreground leading-relaxed">
          Revise o carrinho, as linhas de sorvete e o valor do sinal. Na etapa seguinte você escolhe
          retirada na loja ou entrega no evento.
        </p>
      </header>

      <div className="mt-10">
        <FestCartView />
      </div>
    </main>
  );
}
