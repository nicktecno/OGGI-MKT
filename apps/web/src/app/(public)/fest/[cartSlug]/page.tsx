import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FestConfigurator } from "@/components/loslos-fest/fest-configurator";
import { LoslosHeading } from "@/components/loslos-fest/loslos-heading";
import { getCartModelBySlug } from "@/lib/loslos-fest/mock-data";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ cartSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cartSlug } = await params;
  const cart = getCartModelBySlug(cartSlug);
  if (!cart) return { title: "Carrinho não encontrado" };
  return {
    title: `Montar ${cart.name}`,
    description: `Configure ${cart.capacity} unidades — ${SITE_NAME}.`,
  };
}

export default async function FestConfigurePage({ params }: Props) {
  const { cartSlug } = await params;
  const cart = getCartModelBySlug(cartSlug);
  if (!cart) notFound();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 pb-24">
      <nav className="text-sm font-semibold text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>
        <span className="mx-2 text-primary">/</span>
        <Link href="/fest" className="hover:text-primary">
          Los Los Fest
        </Link>
        <span className="mx-2 text-primary">/</span>
        <span className="text-primary">{cart.name}</span>
      </nav>

      <div className="mt-8">
        <LoslosHeading
          band
          eyebrow="Passo 2"
          title={`Monte seu ${cart.name}`}
          subtitle={`Use um modelo ou escolha as linhas até completar ${cart.capacity} unidades.`}
        />
      </div>

      <div className="mt-10">
        <FestConfigurator cartModel={cart} />
      </div>
    </main>
  );
}
