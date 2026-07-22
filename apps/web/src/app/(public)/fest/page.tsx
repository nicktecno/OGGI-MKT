import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { FestCatalogLinesGrid } from "@/components/oggi-fest/fest-catalog-lines-grid";
import { OggiHeading } from "@/components/oggi-fest/oggi-heading";
import { buttonVariants } from "@/components/ui/button";
import { OGGI_FEST_MIN_ORDER_BRL } from "@/lib/oggi-fest/constants";
import { FEST_CART_MODELS } from "@/lib/oggi-fest/mock-data";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";
import { cn, formatBrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Montar pedido",
  description: `Escolha o carrinho Los Los Fest e os sabores de sorvete — ${SITE_NAME}.`,
};

export default function FestPage() {
  return (
    <main className="pb-24">
      <div className="border-b border-border bg-card">
        <div className="relative mx-auto max-w-7xl overflow-hidden px-6 py-12 md:py-16">
          <div className="relative z-10 max-w-xl">
            <OggiHeading
              band
              eyebrow="Passo 1"
              title="Escolha o carrinho"
              subtitle={`Pedido mínimo de ${formatBrl(OGGI_FEST_MIN_ORDER_BRL)} em sorvetes. Locação do carrinho sem custo adicional acima desse valor.`}
            />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(48%,520px)] md:block">
            <Image
              src={MARKETING_IMAGES.festBanner}
              alt="Carrinho Los Los em evento"
              fill
              className="object-contain object-right p-4 md:p-6"
              sizes="(max-width: 768px) 0vw, 48vw"
              priority
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 md:grid-cols-2">
          {FEST_CART_MODELS.map((cart) => (
            <article key={cart.id} className="oggi-card flex flex-col">
              <div className="relative aspect-[16/10] bg-[#0f1a1b]">
                <Image
                  src={cart.imageUrl}
                  alt={cart.name}
                  fill
                  className="object-contain p-6"
                  sizes="600px"
                />
              </div>
              <div className="flex flex-1 flex-col border-t border-primary/15 p-6">
                <h2 className="font-heading text-2xl font-extrabold uppercase text-primary">{cart.name}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{cart.description}</p>
                <span className="oggi-pill mt-4 w-fit">{cart.capacity} unidades</span>
                <Link
                  href={`/fest/${cart.slug}`}
                  className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full justify-center")}
                >
                  Montar este carrinho
                </Link>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-20 rounded-2xl bg-card border border-primary/20 p-8 md:p-10" aria-labelledby="linhas-heading">
          <OggiHeading
            eyebrow="Sabores Los Los"
            title="Catálogo de sorvetes"
            subtitle="No próximo passo você distribui as unidades por sabor ou aplica um modelo pronto."
          />
          <FestCatalogLinesGrid className="mt-10 grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
        </section>
      </div>
    </main>
  );
}
