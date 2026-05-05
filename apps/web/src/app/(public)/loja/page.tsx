import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CatalogProductGrid } from "@/components/loja/catalog-product-grid";
import { searchCatalogRowsFromData } from "@/lib/demo-seed";
import { getDemoCommerceState } from "@/lib/demo-runtime";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";
import { cn, formatBrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loja",
  description: `${SITE_NAME} — peças artesanais escolhidas com carinho.`,
};

type LojaPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function LojaPage({ searchParams }: LojaPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const commerce = await getDemoCommerceState();
  const rows = searchCatalogRowsFromData(
    commerce.products,
    commerce.productionAssignments,
    query || undefined,
  );
  const heroListing = rows[0];

  return (
    <main className="pb-24">
      <div className="border-b border-border/60 bg-gradient-to-r from-muted/45 via-card/80 to-muted/35">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:justify-between">
          <span>Envio combinado</span>
          <span>Pagamento seguro</span>
          <span>Curadoria {SITE_NAME}</span>
          <span>Estoque por ateliê</span>
        </div>
      </div>

      <section className="border-b border-border/60 bg-gradient-to-b from-card/40 to-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:gap-14 md:py-16 lg:grid-cols-12 lg:items-stretch">
          <div className="flex flex-col justify-center lg:col-span-5">
            <nav className="text-xs text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">
                Início
              </Link>
              <span className="mx-2 text-border">/</span>
              <span className="font-medium text-foreground">Loja</span>
            </nav>
            <h1 className="mt-4 font-serif text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-[2.5rem] lg:leading-[1.12]">
              Loja online — moda artesanal pronta para o carrinho
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Preço à vista, estoque real por costureira e checkout em poucos cliques. Use a busca no topo para filtrar
              por nome, SKU ou cidade.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#destaque" className={cn(buttonVariants({ size: "lg" }))}>
                Ver catálogo
              </Link>
              <Link
                href="/carrinho"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-foreground/12 bg-background/50 backdrop-blur-sm",
                )}
              >
                Meu carrinho
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            {heroListing ? (
              <Link
                href={`/loja/produto/${heroListing.product.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border/50 shadow-luxury-sm ring-1 ring-foreground/[0.04] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-luxury"
              >
                <div className="relative aspect-[4/3] lg:aspect-[16/10]">
                  <Image
                    src={heroListing.product.imagem_url}
                    alt={heroListing.product.nome}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-accent">
                      Destaque da vitrine
                    </p>
                    <p className="mt-2 font-serif text-xl font-medium text-foreground md:text-2xl">
                      {heroListing.product.nome}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{heroListing.listing.executorNome}</p>
                    <p className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground">
                      {formatBrl(heroListing.product.preco_venda_publico)}
                    </p>
                    <span className="mt-3 inline-flex text-sm font-medium text-accent group-hover:underline">
                      Ver detalhes e comprar →
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/50 shadow-luxury-sm lg:aspect-[16/10]">
                <Image
                  src={MARKETING_IMAGES.lojaBanner}
                  alt="Vitrine com roupas clássicas em cabides"
                  fill
                  className="object-cover object-[center_30%]"
                  sizes="(max-width: 1200px) 100vw, 60vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="destaque" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16 md:py-20">
        <div className="mb-10 flex flex-col gap-4 border-b border-border/50 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-accent">Catálogo</p>
            <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight md:text-3xl">
              {query ? "Resultados da busca" : "Todas as ofertas na vitrine"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {query ? (
                <>
                  {rows.length} resultado{rows.length === 1 ? "" : "s"} para “{query}”
                </>
              ) : (
                <>
                  {rows.length} oferta{rows.length === 1 ? "" : "s"} com estoque publicado
                  {rows.length === 1 ? "" : "s"} — clique no card para ver tamanhos, fotos e adicionar ao carrinho.
                </>
              )}
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            ← Voltar ao início
          </Link>
        </div>

        <CatalogProductGrid
          rows={rows}
          columns="2-4"
          emptyContent={
            query ? (
              <>
                Nenhum resultado para “{query}”.{" "}
                <Link href="/loja" className="font-medium text-accent underline-offset-4 hover:underline">
                  Limpar busca
                </Link>
              </>
            ) : (
              "Nenhuma oferta publicada no momento."
            )
          }
        />

        <p className="mt-14 text-center text-sm text-muted-foreground md:text-base">
          Dúvidas na compra? Entre em contato após o pedido — suporte humano e rastreio quando disponível.
        </p>
      </section>
    </main>
  );
}
