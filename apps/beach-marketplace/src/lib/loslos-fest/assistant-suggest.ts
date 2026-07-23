import type { AdminCatalog } from "./admin-catalog-storage";
import { FEST_CART_MODELS } from "./mock-data";
import type { FestCartModel, FestTemplate } from "./types";

export type GuestRange = "ate-50" | "51-100" | "101-150" | "150-plus";

export type OccasionChoice =
  | "aniversario"
  | "casamento"
  | "corporativo"
  | "churrasco"
  | "festa-junina";

export const GUEST_RANGE_OPTIONS: { id: GuestRange; label: string }[] = [
  { id: "ate-50", label: "Até 50 convidados" },
  { id: "51-100", label: "51 a 100" },
  { id: "101-150", label: "101 a 150" },
  { id: "150-plus", label: "Mais de 150" },
];

export const OCCASION_OPTIONS: { id: OccasionChoice; label: string }[] = [
  { id: "aniversario", label: "Aniversário" },
  { id: "casamento", label: "Casamento" },
  { id: "corporativo", label: "Corporativo" },
  { id: "churrasco", label: "Churrasco" },
  { id: "festa-junina", label: "Festa junina" },
];

export function suggestCartSlug(guests: GuestRange): "carrinho-200" | "carrinho-300" {
  if (guests === "101-150" || guests === "150-plus") return "carrinho-300";
  return "carrinho-200";
}

export function getCartBySlug(slug: "carrinho-200" | "carrinho-300"): FestCartModel {
  const cart = FEST_CART_MODELS.find((c) => c.slug === slug);
  if (!cart) throw new Error(`Carrinho não encontrado: ${slug}`);
  return cart;
}

export function suggestTemplate(
  catalog: AdminCatalog,
  occasion: OccasionChoice,
): FestTemplate | undefined {
  if (occasion === "festa-junina") {
    return (
      catalog.templates.find((t) => t.slug === "festa-junina") ??
      catalog.templates.find((t) => t.occasion === "infantil")
    );
  }
  const featured = catalog.templates.find((t) => t.occasion === occasion && t.featured);
  return featured ?? catalog.templates.find((t) => t.occasion === occasion);
}

export function guestRangeLabel(guests: GuestRange): string {
  return GUEST_RANGE_OPTIONS.find((o) => o.id === guests)?.label ?? guests;
}

export function occasionLabel(occasion: OccasionChoice): string {
  return OCCASION_OPTIONS.find((o) => o.id === occasion)?.label ?? occasion;
}
