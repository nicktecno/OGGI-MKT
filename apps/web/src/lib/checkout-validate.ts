import type { CartLine } from "@/lib/cart-types";
import type { DemoCommerceState } from "@/lib/commerce-cookies";
import type { CheckoutReserveLine } from "@/lib/commerce-backend";

const MAX_LINES = 20;

function isCartLine(x: unknown): x is CartLine {
  if (typeof x !== "object" || x === null) return false;
  const l = x as Record<string, unknown>;
  return (
    typeof l.listingId === "string" &&
    typeof l.productSlug === "string" &&
    typeof l.productName === "string" &&
    typeof l.unitPrice === "number" &&
    typeof l.quantity === "number" &&
    typeof l.maxQuantity === "number" &&
    typeof l.executorNome === "string"
  );
}

function pricesMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.02;
}

export function validateCartForCheckout(
  lines: unknown,
  state: DemoCommerceState,
): { ok: true; cart: CartLine[]; reserveLines: CheckoutReserveLine[] } | { ok: false; error: string } {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) {
    return { ok: false, error: "Carrinho inválido." };
  }
  const cart: CartLine[] = [];
  for (const row of lines) {
    if (!isCartLine(row)) {
      return { ok: false, error: "Formato de item inválido." };
    }
    if (row.quantity < 1 || row.quantity > row.maxQuantity || row.quantity > 99) {
      return { ok: false, error: "Quantidade inválida." };
    }
    if (row.unitPrice <= 0 || row.unitPrice > 500_000 || !Number.isFinite(row.unitPrice)) {
      return { ok: false, error: "Preço inválido." };
    }
    cart.push(row);
  }

  for (const line of cart) {
    const assignment = state.productionAssignments.find((a) => a.id === line.listingId);
    if (!assignment) {
      return { ok: false, error: "Uma das ofertas não está mais disponível." };
    }
    if (assignment.status !== "PUBLISHED") {
      return { ok: false, error: "Uma das ofertas não está publicada na loja." };
    }
    if (assignment.available_quantity < line.quantity || line.quantity > line.maxQuantity) {
      return { ok: false, error: "Estoque insuficiente ou quantidade inválida. Atualize o carrinho." };
    }
    const product = state.products.find((p) => p.id === assignment.compositeProductId);
    if (!product) {
      return { ok: false, error: "Peça não encontrada no catálogo." };
    }
    if (!product.ativo || product.admin_pausado) {
      return { ok: false, error: `O produto "${product.nome}" não está disponível para compra.` };
    }
    if (!pricesMatch(product.preco_venda_publico, line.unitPrice)) {
      return { ok: false, error: "O preço de um dos itens mudou. Atualize o carrinho na loja." };
    }
  }

  const reserveLines: CheckoutReserveLine[] = cart.map((l) => ({
    listing_id: l.listingId,
    quantity: l.quantity,
  }));
  return { ok: true, cart, reserveLines };
}
