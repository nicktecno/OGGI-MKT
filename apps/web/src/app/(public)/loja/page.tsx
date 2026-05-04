import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <main className="pb-20">
      <section className="relative border-b border-border">
        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
              Vitrine
            </p>
            <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight md:text-5xl">
              {SITE_NAME}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Aqui você encontra peças feitas com dedicação por costureiras e pequenos
              ateliês — moda artesanal para vestir com orgulho.
            </p>
            <Link
              href="/loja#destaque"
              className={cn(
                buttonVariants({ variant: "outline", size: "xl" }),
                "mt-8 inline-flex",
              )}
            >
              Ver ofertas em destaque
            </Link>
          </div>
        </div>
        <div className="relative mx-auto max-w-6xl px-6 pb-12">
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl border border-border shadow-sm">
            <Image
              src={MARKETING_IMAGES.lojaBanner}
              alt="Vitrine com roupas clássicas em cabides"
              fill
              className="object-cover object-[center_30%] md:object-[center_35%]"
              sizes="(max-width: 1200px) 100vw, 1152px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section id="destaque" className="mx-auto max-w-6xl scroll-mt-28 px-6 py-16">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-medium tracking-tight md:text-3xl">
              Em destaque
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {query ? (
                <>
                  {rows.length} resultado{rows.length === 1 ? "" : "s"} para “{query}”
                </>
              ) : (
                <>
                  {rows.length} oferta{rows.length === 1 ? "" : "s"} publicada
                  {rows.length === 1 ? "" : "s"}
                </>
              )}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {query ? (
              <>
                Nenhum resultado para “{query}”.{" "}
                <Link href="/loja" className="text-accent underline-offset-4 hover:underline">
                  Limpar busca
                </Link>
              </>
            ) : (
              "Nenhuma oferta publicada no seed."
            )}
          </p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ listing, product }) => (
              <li key={listing.id}>
                <Link
                  href={`/loja/produto/${product.slug}`}
                  className="block h-full rounded-xl outline-none ring-offset-background focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <Card className="h-full overflow-hidden border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative aspect-[4/5] border-b border-border">
                      <Image
                        src={product.imagem_url}
                        alt={product.nome}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="font-serif text-xl leading-snug">
                        {product.nome}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.descricao_curta}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <span className="text-foreground">
                          {formatBrl(product.preco_venda_publico)}
                        </span>
                        {" · "}
                        <span>{listing.available_quantity} em estoque</span>
                      </p>
                      <p className="text-xs">
                        {listing.executorNome}
                        <br />
                        Origem: {listing.cidade_origem} · CEP {listing.cep_origem}
                      </p>
                    </CardContent>
                    <CardFooter className="border-t border-border/60 bg-muted/20 pt-4">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        SKU {product.sku}
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Novas peças e costureiras entram aos poucos — a vitrine cresce com quem faz moda com carinho.
        </p>
      </section>
    </main>
  );
}
