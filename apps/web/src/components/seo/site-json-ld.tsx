import { getSiteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

/** Organization + WebSite (SearchAction) para rich results e contexto da marca. */
export function SiteJsonLd() {
  const base = getSiteUrl();
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: base,
        description:
          "Marketplace de moda artesanal com curadoria, ligando clientes a ateliês e costureiras independentes.",
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: base,
        inLanguage: "pt-BR",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/loja?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
