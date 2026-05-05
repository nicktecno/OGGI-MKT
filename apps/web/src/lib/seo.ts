import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";

/** Defina em produção para URLs canónicas e cartões sociais corretos. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* ignorar */
    }
  }
  return "http://localhost:3000";
}

/** Imagem padrão para OG/Twitter (absoluta). */
export const SEO_DEFAULT_OG_IMAGE = MARKETING_IMAGES.homeHero;

/** Meta description global (~155 caracteres) — benefício + diferencial + marca. */
export const SEO_DEFAULT_DESCRIPTION =
  "Compre moda artesanal com curadoria: peças únicas de ateliês independentes, entrega segura e atendimento humano. Descubra a Moda Store.";

/** Título da home (segmento antes de ` | ${SITE_NAME}`). */
export const SEO_HOME_TITLE_SEGMENT =
  "Moda artesanal de ateliês — peças únicas com curadoria";

/** Description específica da home (variação para não duplicar snippet com outras páginas). */
export const SEO_HOME_DESCRIPTION =
  "Vitrine de roupas e acessórios feitos à mão: conheça costureiras independentes, escolha com calma e receba com segurança. Moda Store — moda com história.";

export const SEO_KEYWORDS = [
  SITE_NAME,
  "moda artesanal",
  "moda independente",
  "ateliê de costura",
  "roupas artesanais",
  "e-commerce moda Brasil",
  "peças exclusivas",
  "curadoria moda",
] as const;

const SERP_DESCRIPTION_MAX = 158;

/** Recorta texto para snippet de busca sem cortar no meio de palavra quando possível. */
export function clipForSerp(text: string, max = SERP_DESCRIPTION_MAX): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > max * 0.65) return `${slice.slice(0, lastSpace)}…`;
  return `${slice}…`;
}

/** Garante URL absoluta para JSON-LD e OG (já absolutas passam direto). */
export function toAbsoluteUrl(href: string, origin = getSiteUrl()): string {
  const h = href.trim();
  if (!h) return origin;
  if (/^https?:\/\//i.test(h)) return h;
  const path = h.startsWith("/") ? h : `/${h}`;
  return `${origin}${path}`;
}
