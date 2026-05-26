import type { CartLine } from "@/lib/cart-types";

/** Nome do item com tamanho, para carrinho, checkout e e-mails. */
export function cartLineLabel(line: Pick<CartLine, "productName" | "size">): string {
  return line.size ? `${line.productName} — tam. ${line.size}` : line.productName;
}

export function cartLinesMatch(
  line: Pick<CartLine, "listingId" | "size">,
  listingId: string,
  size?: string,
): boolean {
  return line.listingId === listingId && (line.size ?? "") === (size ?? "");
}
