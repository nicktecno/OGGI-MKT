import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductJsonLd } from "@/components/seo/product-json-ld";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddToCartActions } from "@/components/loja/add-to-cart";
import { ProductPageGallery } from "@/components/loja/product-page-gallery";
import {
  DEMO_COMPOSITE_PRODUCTS,
  getListingForProduct,
  getProductBySlug,
  productImageSlides,
} from "@/lib/demo-seed";
import { getDemoCommerceState } from "@/lib/demo-runtime";
import { clipForSerp, toAbsoluteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { formatBrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return DEMO_COMPOSITE_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const commerce = await getDemoCommerceState();
  const product = getProductBySlug(slug, commerce.products);
  if (!product) return { title: "Produto", robots: { index: false, follow: false } };
  const listing = getListingForProduct(product.id, commerce.productionAssignments);
  if (!listing) {
    return { title: "Produto", robots: { index: false, follow: false } };
  }
  const galleryUrls = productImageSlides(product);
  const desc = clipForSerp(product.descricao_curta || product.nome);
  const path = `/loja/produto/${product.slug}`;
  const ogImages = galleryUrls.map((u) => ({
    url: toAbsoluteUrl(u),
    alt: product.nome,
  }));
  return {
    title: product.nome,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: `${product.nome} | ${SITE_NAME}`,
      description: desc,
      url: path,
      type: "website",
      images: ogImages.length ? ogImages : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.nome,
      description: desc,
      images: galleryUrls[0] ? [toAbsoluteUrl(galleryUrls[0])] : undefined,
    },
  };
}

export default async function ProdutoLojaPage({ params }: Props) {
  const { slug } = await params;
  const commerce = await getDemoCommerceState();
  const product = getProductBySlug(slug, commerce.products);
  if (!product) notFound();

  const listing = getListingForProduct(product.id, commerce.productionAssignments);
  if (!listing) notFound();

  const galleryUrls = productImageSlides(product);

  return (
    <main className="pb-20">
      <ProductJsonLd product={product} listing={listing} imageUrls={galleryUrls} />
      <div className="border-b border-border bg-muted/15">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <nav className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Início
            </Link>
            <span className="mx-2 text-border">/</span>
            <Link href="/loja" className="hover:text-foreground">
              Loja
            </Link>
            <span className="mx-2 text-border">/</span>
            <span className="text-foreground">{product.nome}</span>
          </nav>
        </div>
      </div>

      <article className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          <div className="space-y-4">
            <ProductPageGallery productName={product.nome} imageUrls={galleryUrls} />
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              SKU {product.sku}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
              {SITE_NAME}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight md:text-4xl">
              {product.nome}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {product.descricao_curta}
            </p>
            <p className="mt-8 font-serif text-3xl font-medium tabular-nums text-foreground">
              {formatBrl(product.preco_venda_publico)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {listing.available_quantity}{" "}
              {listing.available_quantity === 1 ? "peça disponível" : "peças disponíveis"} nesta
              oferta.
            </p>

            <AddToCartActions
              className="mt-10"
              item={{
                listingId: listing.id,
                productSlug: product.slug,
                productName: product.nome,
                unitPrice: product.preco_venda_publico,
                maxQuantity: listing.available_quantity,
                executorNome: listing.executorNome,
                imageUrl: galleryUrls[0] ?? product.imagem_url,
              }}
            />
            <div className="mt-4">
              <Link href="/loja" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                ← Voltar à loja
              </Link>
            </div>

            <Card className="mt-12 border-border bg-card/80">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Quem faz</CardTitle>
                <CardDescription>Oferta publicada por esta costureira (demo).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{listing.executorNome}</p>
                <p>
                  Origem do envio: {listing.cidade_origem}
                  <br />
                  CEP {listing.cep_origem}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </article>
    </main>
  );
}
