/** Tokens de marca Oggi Sorvetes / Oggi Fest (espelho do site institucional). */
export const OGGI_BRAND = {
  pink: "#E2007A",
  pinkDark: "#B80062",
  pinkLight: "#FFF0F7",
  pinkSoft: "#FBD0E8",
  yellow: "#FFC72C",
  text: "#2D2D2D",
  textMuted: "#5C5C5C",
  white: "#FFFFFF",
} as const;

/**
 * Imagens das linhas de picolé (extraídas de oggisorvetes.com.br/produtos/picoles/).
 * @see https://oggisorvetes.com.br/produtos/picoles/
 */
export const OGGI_LINE_IMAGE = {
  classicos: "/oggi/lines/classicos.webp",
  delicia: "/oggi/lines/delicia.webp",
  meuSabor: "/oggi/lines/meu-sabor.png",
  fazenda: "/oggi/lines/fazenda.webp",
  festaAgua: "/oggi/lines/festa-agua.webp",
  festaLeite: "/oggi/lines/festa-leite.webp",
  frutos: "/oggi/lines/frutos.webp",
  helloKitty: "/oggi/lines/hello-kitty.webp",
  sensa: "/oggi/lines/sensa.webp",
} as const;

export const OGGI_CART_IMAGE = {
  cart200: "/oggi/carts/carrinho-200.png",
  cart300: "/oggi/carts/carrinho-300.png",
} as const;

export const OGGI_MARKETING = {
  hero: "/oggi/marketing/hero-fest.svg",
  /** Arte do hero /fest e home (produtos Oggi sobre fundo preto). */
  festBanner: "/sorvetes-65b41d5ad00cb.webp",
  loginHero: "/sorvetes-65b41d5ad00cb.webp",
} as const;

/** Logo SVG oficial e favicon local (derivado do logo). */
export const OGGI_LOGO_SVG_URL =
  "https://oggisorvetes.com.br/wp-content/uploads/2023/05/oggi.svg";

export const OGGI_LOGO = {
  /** Branco — fundos rosa/escuros */
  white: "/oggi.svg",
  /** Rosa marca — header e fundos claros */
  brand: "/oggi-logo-brand.svg",
} as const;

export const OGGI_FAVICON_URL = "/oggi-favicon.svg";

/** Fotos temáticas (Unsplash) para capas dos modelos de festa. */
export const FEST_MODEL_IMAGE = {
  aniversario:
    "https://images.unsplash.com/photo-1760115090655-9ca46694d97a?auto=format&fit=crop&w=800&h=600&q=80",
  casamento:
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&h=600&q=80",
  corporativo:
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&h=600&q=80",
  churrasco:
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&h=600&q=80",
  infantil:
    "https://images.unsplash.com/photo-1760115090655-9ca46694d97a?auto=format&fit=crop&w=800&h=600&q=80",
} as const;

/** Capas por slug quando o tema não bate só com `occasion`. */
export const FEST_MODEL_IMAGE_BY_SLUG: Record<string, string> = {
  "aniversario-infantil":
    "https://images.unsplash.com/photo-1760115090655-9ca46694d97a?auto=format&fit=crop&w=800&h=600&q=80",
  "festa-junina":
    "https://images.unsplash.com/photo-1465060810938-30bbe7c40e76?auto=format&fit=crop&w=800&h=600&q=80",
};

/** URLs antigas substituídas — usadas na migração do catálogo local. */
export const DEPRECATED_FEST_MODEL_IMAGES = new Set([
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&h=600&q=80",
  "https://images.unsplash.com/photo-1470229722913-7e0e3a28d5e9?auto=format&fit=crop&w=800&h=600&q=80",
  "https://images.unsplash.com/photo-1464349095431-e9a21285b5e1?auto=format&fit=crop&w=800&h=600&q=80",
]);

export type FestModelOccasion = keyof typeof FEST_MODEL_IMAGE;

export function festModelImageUrl(occasion: FestModelOccasion, slug?: string): string {
  if (slug && FEST_MODEL_IMAGE_BY_SLUG[slug]) return FEST_MODEL_IMAGE_BY_SLUG[slug];
  return FEST_MODEL_IMAGE[occasion];
}
