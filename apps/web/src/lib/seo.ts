import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";

/**
 * Origem canónica (OG, sitemap, `metadataBase`).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* ignorar */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      const host = vercel.replace(/^https?:\/\//i, "");
      return new URL(`https://${host}`).origin;
    } catch {
      /* ignorar */
    }
  }
  return "http://localhost:3000";
}

export const SEO_DEFAULT_OG_IMAGE = MARKETING_IMAGES.homeHero;

export const SEO_DEFAULT_DESCRIPTION =
  "Alugue o carrinho Oggi Fest para sua festa: escolha 200 ou 300 picolés, monte por linha de sorvete ou use modelos. Retire na loja ou receba no evento.";

export const SEO_HOME_TITLE_SEGMENT = "Oggi Fest — carrinho de sorvete para sua festa";

export const SEO_HOME_DESCRIPTION =
  "A comemoração é sua e o sorvete é nosso. Monte seu pedido com modelos para aniversário, casamento e mais. Pedido mínimo R$ 300 — locação do carrinho grátis.";

export const SEO_KEYWORDS = [
  SITE_NAME,
  "Oggi Sorvetes",
  "carrinho de sorvete festa",
  "picolé festa infantil",
  "Oggi Fest",
  "sorvete evento",
  "aluguel carrinho sorvete",
] as const;

const SERP_DESCRIPTION_MAX = 158;

export function clipForSerp(text: string, max = SERP_DESCRIPTION_MAX): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > max * 0.65) return `${slice.slice(0, lastSpace)}…`;
  return `${slice}…`;
}

export function toAbsoluteUrl(href: string, origin = getSiteUrl()): string {
  const h = href.trim();
  if (!h) return origin;
  if (/^https?:\/\//i.test(h)) return h;
  const path = h.startsWith("/") ? h : `/${h}`;
  return `${origin}${path}`;
}
