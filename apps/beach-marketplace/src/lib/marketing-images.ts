import {
  LOSLOS_CART_IMAGE,
  LOSLOS_LINE_IMAGE,
  LOSLOS_MARKETING,
} from "@/lib/loslos-fest/brand";

/**
 * Imagens de marketing Los Los Fest (assets locais em /public/loslos).
 */
export const MARKETING_IMAGES = {
  homeHero: LOSLOS_MARKETING.hero,
  homeEditorial1: LOSLOS_LINE_IMAGE.helloKitty,
  homeEditorial2: LOSLOS_CART_IMAGE.cart300,
  homeEditorial3: LOSLOS_LINE_IMAGE.frutos,
  homePurpose: LOSLOS_LINE_IMAGE.delicia,
  entrarSide: LOSLOS_LINE_IMAGE.classicos,
  loginHero: LOSLOS_MARKETING.loginHero,
  festBanner: LOSLOS_MARKETING.festBanner,
  lojaBanner: LOSLOS_MARKETING.festBanner,
} as const;
