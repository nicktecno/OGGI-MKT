import type { DemoCompositeProduct, DemoListing } from "@/lib/demo-seed";
import { clipForSerp, getSiteUrl, toAbsoluteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

type Props = {
  product: DemoCompositeProduct;
  listing: DemoListing;
  imageUrls: string[];
};

export function ProductJsonLd({ product, listing, imageUrls }: Props) {
  const origin = getSiteUrl();
  const url = `${origin}/loja/produto/${encodeURIComponent(product.slug)}`;
  const images = imageUrls.map((u) => toAbsoluteUrl(u, origin)).filter(Boolean);
  const desc = clipForSerp(product.descricao_curta || product.nome, 300);

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: origin },
          { "@type": "ListItem", position: 2, name: "Loja", item: `${origin}/loja` },
          { "@type": "ListItem", position: 3, name: product.nome, item: url },
        ],
      },
      {
        "@type": "Product",
        name: product.nome,
        description: desc,
        sku: product.sku,
        image: images.length ? images : undefined,
        brand: { "@type": "Brand", name: SITE_NAME },
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "BRL",
          price:
            typeof product.preco_venda_publico === "number" && Number.isFinite(product.preco_venda_publico)
              ? product.preco_venda_publico
              : Number(product.preco_venda_publico) || 0,
          availability:
            listing.available_quantity > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: listing.executorNome,
          },
        },
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />
  );
}
