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
import { Calendar, Truck } from "lucide-react";

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
    a: `${formatBrl(OGGI_FEST_MIN_ORDER_BRL)} em produtos Oggi. Locação do carrinho sem custo acima desse valor.`,
  },
  {
    q: "Entregam o carrinho?",
    a: "A retirada é feita por você na loja. Entrega no local do evento pode ser orçada à parte conforme distância.",
  },
  {
    q: "Quanto tempo dura a locação?",
    a: `Em média ${OGGI_FEST_RENTAL_HOURS} no horário de funcionamento da loja.`,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b-4 border-primary bg-gradient-to-b from-white via-white to-oggi-pink-light/70">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-12 md:py-20 lg:py-24">
          <div className="max-w-2xl">
            <OggiLogo variant="brand" href={undefined} className="mb-8 h-11 sm:h-12 md:h-14" priority />
            <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-primary">{SITE_NAME}</p>
            <h1 className="mt-4 font-heading text-[2.125rem] font-black uppercase leading-[1.08] tracking-tight text-[#1a1a1a] sm:text-5xl md:text-[3.25rem] lg:text-6xl">
              {SITE_TAGLINE}
            </h1>
            <p className="mt-5 text-xl font-bold leading-snug text-[#1a1a1a] sm:text-2xl md:text-[1.75rem]">
              A comemoração é sua e o sorvete é nosso.
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#3d3d3d] sm:text-lg md:leading-8">
              Bem-vindos ao {SITE_NAME}. Escolha o carrinho de 200 ou 300 picolés, monte pelas linhas
              oficiais Oggi ou use um modelo pronto para sua festa.
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
                  "min-w-[11rem] rounded-full border-2 border-primary text-primary hover:bg-primary/5",
                )}
              >
                Site {SITE_BRAND}
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg md:max-w-none">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-black shadow-xl ring-2 ring-primary/15 sm:aspect-square md:aspect-[4/3]">
              <Image
                src={MARKETING_IMAGES.loginHero}
                alt="Produtos Oggi Sorvetes para festas"
                fill
                priority
                className="object-contain object-center p-4 sm:p-6"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-4 border-primary bg-oggi-pink-light py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-2 ring-primary/10">
            <span className="relative flex h-14 w-[7.25rem] shrink-0 items-center rounded-xl bg-oggi-pink-light/80 p-1.5">
              <span className="relative h-full w-1/2">
                <Image
                  src={OGGI_CART_IMAGE.cart200}
                  alt="Carrinho Fest 200"
                  fill
                  className="object-contain"
                  sizes="56px"
                />
              </span>
              <span className="relative h-full w-1/2">
                <Image
                  src={OGGI_CART_IMAGE.cart300}
                  alt="Carrinho Fest 300"
                  fill
                  className="object-contain"
                  sizes="56px"
                />
              </span>
            </span>
            <div>
              <h2 className="font-heading text-base font-extrabold uppercase tracking-wide text-[#1a1a1a]">
                200 ou 300 picolés
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3d3d3d]">
                Dois carrinhos com placas de gel (~4h de conservação).
              </p>
            </div>
          </div>
          {[
            { icon: Calendar, title: "Modelos prontos", text: "Aniversário, casamento, corporativo e mais." },
            { icon: Truck, title: "Retirada ou entrega", text: "Na loja Oggi ou no local do seu evento." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-2 ring-primary/10">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="font-heading text-base font-extrabold uppercase tracking-wide text-[#1a1a1a]">
                  {title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#3d3d3d]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16" aria-labelledby="carrinhos-heading">
        <div className="mx-auto max-w-6xl px-6">
          <OggiHeading eyebrow="Opções de carrinhos" title="Escolha o tamanho" />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {FEST_CART_MODELS.map((cart) => {
              const imageUrl =
                cart.id === "cart-200" ? OGGI_CART_IMAGE.cart200 : OGGI_CART_IMAGE.cart300;
              return (
              <Link
                key={cart.id}
                href={`/fest/${cart.slug}`}
                className="oggi-card group transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] bg-oggi-pink-light">
                  <Image
                    src={imageUrl}
                    alt={cart.name}
                    fill
                    className="object-contain p-6 transition group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
                <div className="border-t-2 border-primary/10 p-6">
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

      <section className="bg-oggi-pink-light py-16" aria-labelledby="linhas-home-heading">
        <div className="mx-auto max-w-6xl px-6">
          <OggiHeading
            eyebrow="Catálogo"
            title="Linhas de sorvete"
            subtitle="Distribua as unidades entre as linhas no passo de montagem."
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

      <section className="border-t-4 border-primary bg-white py-16" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-6">
          <OggiHeading title="Perguntas frequentes" className="text-center [&_h1]:text-center" />
          <dl className="mt-10 space-y-4">
            {faq.map((item) => (
              <div key={item.q} className="rounded-2xl border-2 border-primary/15 bg-oggi-pink-light/50 p-5">
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
