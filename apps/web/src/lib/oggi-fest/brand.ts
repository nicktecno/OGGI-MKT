/** Tokens de marca Sorvetes Los Los / Los Los Fest (espelho do site institucional). */
export const OGGI_BRAND = {
  pink: "#4EC9D4",
  pinkDark: "#36B5C0",
  pinkLight: "#E6F8FA",
  pinkSoft: "#C2EEF1",
  yellow: "#F5C842",
  text: "#FFFFFF",
  textMuted: "#9A9A9A",
  white: "#FFFFFF",
} as const;

/**
 * Imagens dos sabores Los Los (extraídas de sorvetesloslos.com.br).
 * Depreciado: agora os URLs são definidos diretamente no mock-data.ts
 * @see https://sorvetesloslos.com.br/sabores/
 */
export const OGGI_LINE_IMAGE = {
  classicos: "/loslos/products/chocolate.png",
  delicia: "/loslos/products/ovomaltine.png",
  meuSabor: "/loslos/products/leite-avela.png",
  fazenda: "/loslos/products/cheesecake-morango.png",
  festaAgua: "/loslos/products/maracuja.png",
  festaLeite: "/loslos/products/doce-leite-aviacao.png",
  frutos: "/loslos/products/brownie-site.png",
  helloKitty: "/loslos/products/banoffee-nanica.png",
  sensa: "/loslos/products/pistache.png",
} as const;

export const OGGI_CART_IMAGE = {
  cart200: "/loslos/carrinho-novo.png",
  cart300: "/loslos/freezer-novo.png",
} as const;

export const OGGI_MARKETING = {
  hero: "/loslos/marketing/hero-festa.png",
  /** Arte do hero /fest e home (carrinho Los Los em evento). */
  festBanner: "/loslos/marketing/hero-festa.png",
  loginHero: "/loslos/marketing/hero-festa.png",
} as const;

/** Logo oficial e favicon local. */
export const OGGI_LOGO_SVG_URL =
  "https://sorvetesloslos.com.br/storage/2026/02/logo_loslos_branco3.png";

export const OGGI_LOGO = {
  /** Branco — fundos escuros */
  white: "/loslos/logo-white.png",
  /** Marca — header e fundos claros */
  brand: "/loslos/logo-dark.png",
} as const;

export const OGGI_FAVICON_URL = "/loslos/favicon.png";

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
