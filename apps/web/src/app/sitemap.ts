import type { MetadataRoute } from "next";
import { getCatalogRowsFromData, DEMO_COMPOSITE_PRODUCTS } from "@/lib/demo-seed";
import { getStorefrontCommerceState } from "@/lib/demo-runtime";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  let slugs = DEMO_COMPOSITE_PRODUCTS.filter((p) => p.ativo && !p.admin_pausado).map((p) => p.slug);
  try {
    const state = await getStorefrontCommerceState();
    const rows = getCatalogRowsFromData(state.products, state.productionAssignments);
    slugs = [...new Set(rows.map((r) => r.product.slug))];
  } catch {
    /* build sem API / cookies */
  }

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/loja`, lastModified, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/entrar`, lastModified, changeFrequency: "monthly", priority: 0.35 },
    { url: `${base}/registrar`, lastModified, changeFrequency: "monthly", priority: 0.35 },
  ];

  for (const slug of slugs) {
    entries.push({
      url: `${base}/loja/produto/${encodeURIComponent(slug)}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  }

  return entries;
}
