import type { AdminCatalog } from "./admin-catalog-storage";
import { applyFestTemplate } from "./cart-storage";
import { buildLinesFromTemplate } from "./catalog-helpers";
import type { FestCartModel, FestOrderDraft, FestTemplate } from "./types";

export function createAssistantOrder(
  catalog: AdminCatalog,
  cart: FestCartModel,
  template: FestTemplate,
): FestOrderDraft {
  const draft: FestOrderDraft = {
    version: 1,
    cartModelId: cart.id,
    cartModelSlug: cart.slug,
    cartModelName: cart.name,
    capacity: cart.capacity,
    lines: [],
    addOns: [],
  };
  const lines = buildLinesFromTemplate(catalog, template, cart.capacity);
  return applyFestTemplate(draft, template.id, template.name, lines);
}
