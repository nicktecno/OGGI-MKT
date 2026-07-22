import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { FestCatalogLinesGrid } from "@/components/oggi-fest/fest-catalog-lines-grid";
import { FestCatalogTemplatePills } from "@/components/oggi-fest/fest-catalog-template-pills";
import { OggiHeading } from "@/components/oggi-fest/oggi-heading";
import { OggiLogo } from "@/components/oggi-fest/oggi-logo";
import { buttonVariants } from "@/components/ui/button";
import {
  OGGI_FEST_LEAD_DAYS_RECOMMENDED,
  OGGI_FEST_MIN_ORDER_BRL,
  OGGI_FEST_RENTAL_HOURS,
  OGGI_SITE_URL,
} from "@/lib/oggi-fest/constants";
import { OGGI_CART_IMAGE } from "@/lib/oggi-fest/brand";
import { FEST_CART_MODELS } from "@/lib/oggi-fest/mock-data";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SEO_HOME_DESCRIPTION, SEO_HOME_TITLE_SEGMENT } from "@/lib/seo";
import { SITE_BRAND, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { cn, formatBrl } from "@/lib/utils";
import { Calendar, Truck, Package } from "lucide-react";
import { HomeCarousel } from "@/components/oggi-fest/home-carousel";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: SEO_HOME_TITLE_SEGMENT,
  description: SEO_HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SEO_HOME_TITLE_SEGMENT} | ${SITE_NAME}`,
    description: SEO_HOME_DESCRIPTION,
    url: "/",
    images: [{ url: MARKETING_IMAGES.homeHero, width: 1600, height: 900, alt: SITE_NAME }],
  },
};

const faq = [
  {
    q: "Com quanto tempo de antecedência solicitar?",
    a: `De ${OGGI_FEST_LEAD_DAYS_RECOMMENDED} a 10 dias no mínimo. Quanto antes reservar, melhor.`,
  },
  {
    q: "Qual o valor mínimo?",
    a: `${formatBrl(OGGI_FEST_MIN_ORDER_BRL)} em produtos Los Los. Locação do carrinho sem custo acima desse valor.`,
  },
  {
    q: "Entregam o carrinho?",
    a: "O carrinho Los Los vai até o local do evento. Consulte disponibilidade e frete conforme distância.",
  },
  {
    q: "Quanto tempo dura a locação?",
    a: `Em média ${OGGI_FEST_RENTAL_HOURS} no horário de funcionamento.`,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-[#0f1a1b] via-[#0a0a0a] to-background">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-12 md:py-20 lg:py-24">
          <div className="max-w-2xl">
            <OggiLogo variant="white" href={undefined} className="mb-8 h-14 sm:h-16 md:h-20" priority />
            <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-primary">{SITE_NAME}</p>
            <h1 className="mt-4 font-heading text-[2.125rem] font-black uppercase leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[3.25rem] lg:text-6xl">
              {SITE_TAGLINE}
            </h1>
            <p className="mt-5 text-xl font-bold leading-snug text-foreground/90 sm:text-2xl md:text-[1.75rem]">
              A comemoração é sua e o sorvete é nosso.
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:leading-8">
              Bem-vindos ao {SITE_NAME}. Combine os sabores como quiser e recheie
              sua comemoração com Los Los. 29 sabores incríveis para encantar seus convidados.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/fest"
                className={cn(buttonVariants({ size: "xl" }), "min-w-[11rem] rounded-full")}
              >
                Montar meu pedido
              </Link>
              <a
                href={OGGI_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "xl" }),
                  "min-w-[11rem] rounded-full border-2 border-primary text-primary hover:bg-primary/10",
                )}
              >
                Site {SITE_BRAND}
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg md:max-w-none">
            <HomeCarousel />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          <div className="flex gap-4 rounded-2xl bg-muted p-5 ring-1 ring-primary/20">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Package className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-base font-extrabold uppercase tracking-wide text-foreground">
                Carrinho ou Freezer
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                A partir de 4 caixas. Com guarda-sol e buzina!
              </p>
            </div>
          </div>
          {[
            { icon: Calendar, title: "Modelos prontos", text: "Aniversário, casamento, corporativo e mais." },
            { icon: Truck, title: "Retirada ou entrega", text: "Na loja Los Los ou no local do seu evento." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl bg-muted p-5 ring-1 ring-primary/20">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="font-heading text-base font-extrabold uppercase tracking-wide text-foreground">
                  {title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16" aria-labelledby="carrinhos-heading">
        <div className="mx-auto max-w-6xl px-6">
          <OggiHeading eyebrow="Equipamentos" title="Escolha o formato" />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {FEST_CART_MODELS.map((cart) => {
              const imageUrl =
                cart.id === "cart-200" ? OGGI_CART_IMAGE.cart200 : OGGI_CART_IMAGE.cart300;
              return (
              <Link
                key={cart.id}
                href={`/fest/${cart.slug}`}
                className="oggi-card group transition hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40"
              >
                <div className="relative aspect-[16/10] bg-[#0f1a1b]">
                  <Image
                    src={imageUrl}
                    alt={cart.name}
                    fill
                    className="object-contain p-6 transition group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
                <div className="border-t border-border p-6">
                  <h3 className="font-heading text-xl font-extrabold uppercase text-primary">{cart.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{cart.description}</p>
                  <span className="oggi-pill mt-4 inline-flex">{cart.capacity} unidades</span>
                </div>
              </Link>
            );
            })}
          </div>
        </div>
      </section>

      <section className="bg-card border-y border-border py-16" aria-labelledby="linhas-home-heading">
        <div className="mx-auto max-w-6xl px-6">
          <OggiHeading
            eyebrow="Catálogo"
            title="Sabores Los Los"
            subtitle="29 opções incríveis para combinar como quiser na sua festa."
          />
          <FestCatalogLinesGrid />
        </div>
      </section>

      <section className="py-16" aria-labelledby="modelos-heading">
        <div className="mx-auto max-w-6xl px-6">
          <OggiHeading title="Modelos para cada ocasião" />
          <FestCatalogTemplatePills />
        </div>
      </section>

      <section className="border-t border-border bg-card py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-6">
          <OggiHeading title="Perguntas frequentes" className="text-center [&_h1]:text-center" />
          <dl className="mt-10 space-y-4">
            {faq.map((item) => (
              <div key={item.q} className="rounded-2xl border border-primary/20 bg-muted p-5">
                <dt className="font-heading text-sm font-extrabold uppercase tracking-wide text-primary">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
