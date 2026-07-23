import { SEO_DEFAULT_DESCRIPTION, getSiteUrl } from "@/lib/seo";
import { SITE_BRAND, SITE_NAME } from "@/lib/site";

/** Organization + WebSite (SearchAction) para rich results e contexto da marca. */
export function SiteJsonLd() {
  const base = getSiteUrl();
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_BRAND,
        url: base,
        description: SEO_DEFAULT_DESCRIPTION,
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
            urlTemplate: `${base}/fest?q={search_term_string}`,
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
