import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const editorial = [
  {
    src: MARKETING_IMAGES.homeEditorial1,
    alt: "Mulher costurando à máquina em ateliê",
    title: "Feito com calma",
    text: "Cada peça nasce no ritmo de quem costura todos os dias — com atenção aos detalhes que só o trabalho manual guarda.",
  },
  {
    src: MARKETING_IMAGES.homeEditorial2,
    alt: "Mulher em ateliê ao lado de manequim de costura",
    title: "Pequenos negócios, grande carinho",
    text: "Por trás da Moda Store estão costureiras e pequenos ateliês que transformam tecido em roupa com orgulho e cuidado.",
  },
  {
    src: MARKETING_IMAGES.homeEditorial3,
    alt: "Editorial de moda em tons claros",
    title: "Roupa que conta uma história",
    text: "Aqui você encontra peças pensadas para durar no guarda-roupa — menos pressa, mais afeto no que você veste.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[85vh] overflow-hidden">
        <Image
          src={MARKETING_IMAGES.homeHero}
          alt="Editorial de moda em estúdio, silhueta elegante"
          fill
          priority
          className="object-cover object-[center_25%] md:object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/25 md:from-background md:via-background/70 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:hidden" />
        <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-end px-6 pb-20 pt-32 md:justify-center md:pb-0 md:pt-0">
          <div className="max-w-xl md:max-w-xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-accent">
              {SITE_NAME}
            </p>
            <h1 className="font-serif text-4xl font-medium leading-[1.12] tracking-tight text-foreground md:text-5xl md:leading-[1.08] lg:text-6xl">
              Roupas costuradas com carinho, por quem vive do próprio talento.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              A {SITE_NAME} existe para aproximar você de costureiras e pequenos negócios que fazem moda de forma artesanal —
              com tempo, mão na agulha e respeito por cada detalhe.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/loja" className={cn(buttonVariants({ size: "xl" }))}>
                Ver a loja
              </Link>
              <Link
                href="/entrar"
                className={cn(buttonVariants({ variant: "outline", size: "xl" }))}
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <h2 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">
              Moda que sente o humano por trás
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Sem barulho de fábrica gigante — só gente que ama o que faz e quer que sua roupa te acompanhe com elegância no dia a dia.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {editorial.map((item) => (
              <article
                key={item.title}
                className="group overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/85 to-transparent opacity-70" />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-medium tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
                    {item.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          <div className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-xl border border-border">
            <Image
              src={MARKETING_IMAGES.homePurpose}
              alt="Mulher com blazer e look clássico elegante"
              fill
              className="object-cover object-[center_20%]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
              Nosso propósito
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl">
              Valorizar quem costura no próprio ritmo
            </h2>
            <p className="mt-5 text-muted-foreground md:text-lg">
              Acreditamos em moda feita com calma: peças artesanais, costureiras com seus pequenos negócios e uma experiência de compra simples para você levar esse cuidado para casa.
            </p>
            <ul className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              <li className="border-l-2 border-accent pl-4">
                Peças pensadas para durar — menos descarte, mais afeto no que você veste.
              </li>
              <li className="border-l-2 border-border pl-4">
                Apoio a quem empreende com agulha e linha, mantendo o ofício vivo.
              </li>
              <li className="border-l-2 border-border pl-4">
                Uma vitrine onde a beleza da roupa conversa com a história de quem a fez.
              </li>
            </ul>
            <Link href="/loja" className={cn(buttonVariants({ size: "xl" }), "mt-10 inline-flex")}>
              Explorar peças
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
