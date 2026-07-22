import { OGGI_CART_IMAGE, OGGI_LINE_IMAGE, OGGI_MARKETING } from "@/lib/oggi-fest/brand";

/**
 * Imagens de marketing Los Los Fest (assets locais em /public/oggi).
 */
export const MARKETING_IMAGES = {
  homeHero: OGGI_MARKETING.hero,
  homeEditorial1: OGGI_LINE_IMAGE.helloKitty,
  homeEditorial2: OGGI_CART_IMAGE.cart300,
  homeEditorial3: OGGI_LINE_IMAGE.frutos,
  homePurpose: OGGI_LINE_IMAGE.delicia,
  entrarSide: OGGI_LINE_IMAGE.classicos,
  loginHero: OGGI_MARKETING.loginHero,
  festBanner: OGGI_MARKETING.festBanner,
  lojaBanner: OGGI_MARKETING.festBanner,
} as const;
