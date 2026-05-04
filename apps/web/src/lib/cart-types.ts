/** Carrinho guest/cliente (MVP em localStorage). */

export type CartLine = {
  listingId: string;
  productSlug: string;
  productName: string;
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
