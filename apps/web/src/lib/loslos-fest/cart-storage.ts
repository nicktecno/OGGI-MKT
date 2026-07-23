import type {
  FestAddOnLine,
  FestAddOnProduct,
  FestCartLine,
  FestOrderDraft,
} from "./types";
import { festLinesTotal, festLinesUnitCount } from "./mock-data";
import { LOSLOS_FEST_MIN_ORDER_BRL } from "./constants";

export const FEST_CART_STORAGE_KEY = "loslos_fest_order_v1";
export const FEST_CART_CHANGED_EVENT = "loslos-fest-cart-changed";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function emitChanged() {
  if (isBrowser()) window.dispatchEvent(new Event(FEST_CART_CHANGED_EVENT));
}

function parse(raw: string | null): FestOrderDraft | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as FestOrderDraft;
    if (v?.version !== 1 || !v.cartModelId || !Array.isArray(v.lines))
      return null;
    if (!Array.isArray(v.addOns)) v.addOns = [];
    return v;
  } catch {
    return null;
  }
}

export function readFestOrder(): FestOrderDraft | null {
  if (!isBrowser()) return null;
  return parse(localStorage.getItem(FEST_CART_STORAGE_KEY));
}

export function writeFestOrder(order: FestOrderDraft | null): void {
  if (!isBrowser()) return;
  if (!order) {
    localStorage.removeItem(FEST_CART_STORAGE_KEY);
  } else {
    localStorage.setItem(FEST_CART_STORAGE_KEY, JSON.stringify(order));
  }
  emitChanged();
}

export function clearFestOrder(): void {
  writeFestOrder(null);
}

export function festOrderSubtotal(order: FestOrderDraft): number {
  return festLinesTotal(order.lines);
}

export function festOrderAddOnsSubtotal(order: FestOrderDraft): number {
  return festLinesTotal(order.addOns);
}

export function festOrderGrandTotal(order: FestOrderDraft): number {
  return festOrderSubtotal(order) + festOrderAddOnsSubtotal(order);
}

export function festOrderUnitCount(order: FestOrderDraft): number {
  return festLinesUnitCount(order.lines);
}

export function festOrderMeetsMinimum(order: FestOrderDraft): boolean {
  return festOrderSubtotal(order) >= LOSLOS_FEST_MIN_ORDER_BRL;
}

export function festOrderCapacityFilled(order: FestOrderDraft): boolean {
  return festOrderUnitCount(order) === order.capacity;
}

export function festOrderRemainingUnits(order: FestOrderDraft): number {
  return Math.max(0, order.capacity - festOrderUnitCount(order));
}

export function updateFestLineQuantity(
  order: FestOrderDraft,
  lineId: string,
  quantity: number,
): FestOrderDraft {
  const usedElsewhere = order.lines
    .filter((l) => l.lineId !== lineId)
    .reduce((n, l) => n + l.quantity, 0);
  const maxForLine = order.capacity - usedElsewhere;
  const q = Math.min(Math.max(0, quantity), maxForLine);

  const idx = order.lines.findIndex((l) => l.lineId === lineId);
  let lines: FestCartLine[];
  if (q === 0) {
    lines = order.lines.filter((l) => l.lineId !== lineId);
  } else if (idx === -1) {
    lines = [...order.lines];
  } else {
    lines = order.lines.map((l) =>
      l.lineId === lineId ? { ...l, quantity: q } : l,
    );
  }

  if (q > 0 && idx === -1) {
    /* linha nova deve ser adicionada pelo caller com metadados */
    return { ...order, lines };
  }

  return {
    ...order,
    lines:
      q === 0
        ? lines
        : order.lines.map((l) =>
            l.lineId === lineId ? { ...l, quantity: q } : l,
          ),
  };
}

export function setFestLine(
  order: FestOrderDraft,
  line: FestCartLine,
): FestOrderDraft {
  const usedElsewhere = order.lines
    .filter((l) => l.lineId !== line.lineId)
    .reduce((n, l) => n + l.quantity, 0);
  const maxForLine = order.capacity - usedElsewhere;
  const quantity = Math.min(Math.max(0, line.quantity), maxForLine);
  if (quantity === 0) {
    return {
      ...order,
      lines: order.lines.filter((l) => l.lineId !== line.lineId),
    };
  }
  const idx = order.lines.findIndex((l) => l.lineId === line.lineId);
  const lines =
    idx === -1
      ? [...order.lines, { ...line, quantity }]
      : order.lines.map((l) =>
          l.lineId === line.lineId ? { ...line, quantity } : l,
        );
  return { ...order, lines };
}

export function applyFestLines(
  order: FestOrderDraft,
  lines: FestCartLine[],
): FestOrderDraft {
  return { ...order, lines, templateId: undefined, templateName: undefined };
}

export function applyFestTemplate(
  order: FestOrderDraft,
  templateId: string,
  templateName: string,
  lines: FestCartLine[],
): FestOrderDraft {
  return { ...order, templateId, templateName, lines };
}

export function setFestCustomerCep(
  order: FestOrderDraft,
  customerCep: string,
): FestOrderDraft {
  const digits = customerCep.replace(/\D/g, "").slice(0, 8);
  return { ...order, customerCep: digits.length === 8 ? digits : undefined };
}

export function setFestAddOn(
  order: FestOrderDraft,
  product:
    | FestAddOnProduct
    | Pick<
        FestAddOnLine,
        "productId" | "productName" | "unitPrice" | "imageUrl"
      >,
  quantity: number,
): FestOrderDraft {
  const productId = "productId" in product ? product.productId : product.id;
  const productName =
    "productName" in product ? product.productName : product.name;
  const { unitPrice, imageUrl } = product;
  const q = Math.max(0, Math.floor(quantity));
  const addOns = order.addOns.filter((a) => a.productId !== productId);
  if (q > 0) {
    addOns.push({
      productId,
      productName,
      unitPrice,
      quantity: q,
      imageUrl,
    });
  }
  return { ...order, addOns };
}
