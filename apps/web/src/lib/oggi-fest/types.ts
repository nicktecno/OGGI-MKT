/** Tipos do marketplace Oggi Fest (front mockado). */

export type IceCreamLine = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Preço médio por picolé/unidade na linha (mock). */
  unitPrice: number;
  imageUrl: string;
  tags: string[];
};

export type FestCartModel = {
  id: string;
  slug: string;
  name: string;
  capacity: 200 | 300;
  description: string;
  imageUrl: string;
  /** Locação gratuita acima do pedido mínimo (regra Oggi Fest). */
  rentalIncluded: boolean;
};

export type FestTemplateLine = {
  lineId: string;
  /** Percentual da capacidade do carrinho (0–100). */
  percent: number;
};

export type FestTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string;
  occasion: "aniversario" | "casamento" | "corporativo" | "churrasco" | "infantil";
  imageUrl: string;
  lines: FestTemplateLine[];
  /** Destaque na vitrine */
  featured?: boolean;
};

export type OggiStore = {
  id: string;
  name: string;
  address: string;
  city: string;
  uf: string;
  cep: string;
  phone: string;
  distanceKm?: number;
};

export type FestCartLine = {
  lineId: string;
  lineName: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
};

export type FestOrderDraft = {
  version: 1;
  cartModelId: string;
  cartModelSlug: string;
  cartModelName: string;
  capacity: number;
  lines: FestCartLine[];
  templateId?: string;
  templateName?: string;
  eventDate?: string;
  notes?: string;
};

export type FestDeliveryMode = "retirada" | "entrega";

export type FestCheckoutDraft = {
  version: 1;
  deliveryMode: FestDeliveryMode;
  storeId?: string;
  storeName?: string;
  /** Endereço de entrega do evento (entrega) ou retirada */
  recipientName: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
  eventDate: string;
};
