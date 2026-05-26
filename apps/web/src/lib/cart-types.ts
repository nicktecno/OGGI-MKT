/** Carrinho do cliente persistido em `localStorage` neste navegador. */

export type CartLine = {
  listingId: string;
  productSlug: string;
  productName: string;
  /** Tamanho escolhido na vitrine (P, M, G, etc.). */
  size?: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  executorNome: string;
  imageUrl?: string;
};

export type CartState = {
  version: 1;
  lines: CartLine[];
};
