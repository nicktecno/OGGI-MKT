import type { AdminCatalog } from "./admin-catalog-storage";
import type { FestTemplate, IceCreamLine } from "./types";

export function getLineById(catalog: AdminCatalog, id: string): IceCreamLine | undefined {
  return catalog.lines.find((l) => l.id === id);
}

export function getTemplateById(catalog: AdminCatalog, id: string): FestTemplate | undefined {
  return catalog.templates.find((t) => t.id === id);
}

export function buildLinesFromTemplate(
  catalog: AdminCatalog,
  template: FestTemplate,
  capacity: number,
): { lineId: string; lineName: string; unitPrice: number; quantity: number; imageUrl?: string }[] {
  const raw = template.lines.map((tl) => {
    const line = getLineById(catalog, tl.lineId);
    if (!line) return null;
    const qty = Math.round((capacity * tl.percent) / 100);
    return {
      lineId: line.id,
      lineName: line.name,
      unitPrice: line.unitPrice,
      quantity: qty,
      imageUrl: line.imageUrl,
    };
  });
  const lines = raw.filter((l): l is NonNullable<typeof l> => l !== null);
  const sum = lines.reduce((n, l) => n + l.quantity, 0);
  const diff = capacity - sum;
  if (diff !== 0 && lines.length > 0) {
    const idx = lines.reduce((best, l, i, arr) => (l.quantity > arr[best].quantity ? i : best), 0);
    lines[idx] = { ...lines[idx], quantity: lines[idx].quantity + diff };
  }
  return lines;
}
