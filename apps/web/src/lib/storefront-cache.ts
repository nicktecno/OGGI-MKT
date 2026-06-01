import { revalidatePath, revalidateTag } from "next/cache";
import { STOREFRONT_CACHE_TAG } from "./commerce-backend";

/** Invalida dados cacheados da vitrine e HTML das rotas públicas principais. */
export function revalidateStorefrontCache(productSlug?: string | null) {
  try {
    revalidateTag(STOREFRONT_CACHE_TAG);
  } catch (e) {
    console.error("[revalidateStorefrontCache] tag:", e);
  }
  for (const path of ["/", "/loja"] as const) {
    try {
      revalidatePath(path);
    } catch (e) {
      console.error("[revalidateStorefrontCache] path:", path, e);
    }
  }
  const slug = productSlug?.trim();
  if (slug) {
    try {
      revalidatePath(`/loja/produto/${slug}`);
    } catch (e) {
      console.error("[revalidateStorefrontCache] product:", slug, e);
    }
  }
}
