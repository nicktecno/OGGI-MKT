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
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/18 md:from-background/95 md:via-background/65 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent md:from-background/40 md:via-transparent md:to-background/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_0%_50%,oklch(0.99_0.02_95_/_0.5),transparent_65%)]" />
        <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-end px-6 pb-20 pt-32 md:justify-center md:pb-0 md:pt-0">
          <div className="max-w-xl md:max-w-xl">
            <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-accent">
              {SITE_NAME}
            </p>
            <h1 className="font-serif text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-foreground md:text-5xl md:leading-[1.06] lg:text-[3.35rem] lg:leading-[1.05]">
              Roupas costuradas com carinho, por quem vive do próprio talento.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
              A {SITE_NAME} existe para aproximar você de costureiras e pequenos negócios que fazem moda de forma artesanal —
              com tempo, mão na agulha e respeito por cada detalhe.
            </p>
            <div className="mt-11 flex flex-wrap gap-4">
              <Link href="/loja" className={cn(buttonVariants({ size: "xl" }), "min-w-[11rem] justify-center")}>
                Ver a loja
              </Link>
              <Link
                href="/entrar"
                className={cn(
                  buttonVariants({ variant: "outline", size: "xl" }),
                  "min-w-[11rem] justify-center border-foreground/15 bg-background/40 backdrop-blur-sm hover:bg-background/70",
                )}
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-border/70 bg-gradient-to-b from-card via-card to-background py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.5_0.08_48_/_0.06),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-serif text-3xl font-medium tracking-tight md:text-[2.35rem] md:leading-snug">
              Moda que sente o humano por trás
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg md:leading-relaxed">
              Sem barulho de fábrica gigante — só gente que ama o que faz e quer que sua roupa te acompanhe com elegância no dia a dia.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {editorial.map((item) => (
              <article
                key={item.title}
                className="group overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-luxury-sm ring-1 ring-foreground/[0.04] transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-luxury"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-90" />
                </div>
                <div className="p-7">
                  <h3 className="font-serif text-xl font-medium tracking-tight md:text-[1.35rem]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem] md:leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 md:grid-cols-2">
          <div className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-2xl border border-border/60 shadow-luxury-sm ring-1 ring-foreground/[0.04]">
            <Image
              src={MARKETING_IMAGES.homePurpose}
              alt="Mulher com blazer e look clássico elegante"
              fill
              className="object-cover object-[center_20%]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.38em] text-accent">
              Nosso propósito
            </p>
            <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight md:text-[2.35rem] md:leading-snug">
              Valorizar quem costura no próprio ritmo
            </h2>
            <p className="mt-6 text-muted-foreground md:text-lg md:leading-relaxed">
              Acreditamos em moda feita com calma: peças artesanais, costureiras com seus pequenos negócios e uma experiência de compra simples para você levar esse cuidado para casa.
            </p>
            <ul className="mt-10 space-y-5 text-sm leading-relaxed text-muted-foreground md:text-base md:leading-relaxed">
              <li className="border-l-[3px] border-accent pl-5">
                Peças pensadas para durar — menos descarte, mais afeto no que você veste.
              </li>
              <li className="border-l-[3px] border-border/80 pl-5">
                Apoio a quem empreende com agulha e linha, mantendo o ofício vivo.
              </li>
              <li className="border-l-[3px] border-border/80 pl-5">
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
