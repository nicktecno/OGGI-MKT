import { festModelImageUrl, OGGI_CART_IMAGE, OGGI_LINE_IMAGE } from "./brand";
import type {
  FestAddOnProduct,
  FestCartModel,
  FestTemplate,
  IceCreamLine,
  OggiStore,
} from "./types";

/** Linhas oficiais Oggi Sorvetes (catálogo de picolés). */
export const ICE_CREAM_LINES: IceCreamLine[] = [
  {
    id: "line-classicos",
    slug: "linha-classicos",
    name: "Linha Clássicos",
    description:
      "Base láctea com cremosidade e cobertura crocante de chocolate — os sabores mais amados da casa.",
    unitPrice: 3.5,
    imageUrl: OGGI_LINE_IMAGE.classicos,
    tags: ["lácteo", "clássico"],
  },
  {
    id: "line-delicia",
    slug: "linha-delicia",
    name: "Linha Delícia",
    description: "Sabores criativos e inusitados em picolé cremoso, alguns com agregados especiais.",
    unitPrice: 4.9,
    imageUrl: OGGI_LINE_IMAGE.delicia,
    tags: ["premium", "criativo"],
  },
  {
    id: "line-meu-sabor",
    slug: "linha-meu-sabor",
    name: "Linha Meu Sabor",
    description: "Receitas exclusivas Oggi para quem busca combinações marcantes e diferenciadas.",
    unitPrice: 4.5,
    imageUrl: OGGI_LINE_IMAGE.meuSabor,
    tags: ["exclusivo"],
  },
  {
    id: "line-fazenda",
    slug: "linha-fazenda",
    name: "Linha Fazenda",
    description: "Sabores do campo com base láctea e ingredientes selecionados — muita cremosidade.",
    unitPrice: 4.2,
    imageUrl: OGGI_LINE_IMAGE.fazenda,
    tags: ["fazenda", "natural"],
  },
  {
    id: "line-festa-agua",
    slug: "linha-festa-agua",
    name: "Linha Festa Água",
    description: "Picolés à base de água, leves e refrescantes — ideais para festas ao ar livre.",
    unitPrice: 3.2,
    imageUrl: OGGI_LINE_IMAGE.festaAgua,
    tags: ["água", "refrescante"],
  },
  {
    id: "line-festa-leite",
    slug: "linha-festa-leite",
    name: "Linha Festa Leite",
    description: "Base láctea festiva com sabores celebrativos para aniversários e confraternizações.",
    unitPrice: 3.8,
    imageUrl: OGGI_LINE_IMAGE.festaLeite,
    tags: ["lácteo", "festa"],
  },
  {
    id: "line-frutos",
    slug: "linha-frutos",
    name: "Linha Frutos",
    description: "Base água com o sabor e a refrescância da fruta em cada picolé.",
    unitPrice: 3.8,
    imageUrl: OGGI_LINE_IMAGE.frutos,
    tags: ["frutas", "água"],
  },
  {
    id: "line-hello-kitty",
    slug: "linha-hello-kitty",
    name: "Hello Kitty e Amigos",
    description: "Linha licenciada com formatos e sabores pensados para a criançada.",
    unitPrice: 3.6,
    imageUrl: OGGI_LINE_IMAGE.helloKitty,
    tags: ["infantil", "licenciado"],
  },
  {
    id: "line-sensa",
    slug: "linha-sensa",
    name: "Linha Sensa",
    description: "Massa no palito com casquinha de chocolate e textura mais cremosa que o tradicional.",
    unitPrice: 4.6,
    imageUrl: OGGI_LINE_IMAGE.sensa,
    tags: ["casquinha", "cremoso"],
  },
];

export const FEST_CART_MODELS: FestCartModel[] = [
  {
    id: "cart-200",
    slug: "carrinho-200",
    name: "Carrinho Fest 200",
    capacity: 200,
    description:
      "Ideal para festas médias. Inclui placas de gel (5 unidades) para manter a temperatura por cerca de 4 horas.",
    imageUrl: OGGI_CART_IMAGE.cart200,
    rentalIncluded: true,
  },
  {
    id: "cart-300",
    slug: "carrinho-300",
    name: "Carrinho Fest 300",
    capacity: 300,
    description:
      "Para eventos maiores — capacidade ampliada com o mesmo padrão de conservação do Oggi Fest.",
    imageUrl: OGGI_CART_IMAGE.cart300,
    rentalIncluded: true,
  },
];

export const FEST_TEMPLATES: FestTemplate[] = [
  {
    id: "tpl-aniversario",
    slug: "aniversario-infantil",
    name: "Aniversário infantil",
    description: "Hello Kitty, Clássicos e Frutos — mix colorido para a criançada.",
    occasion: "aniversario",
    imageUrl: festModelImageUrl("aniversario", "aniversario-infantil"),
    featured: true,
    lines: [
      { lineId: "line-hello-kitty", percent: 35 },
      { lineId: "line-classicos", percent: 25 },
      { lineId: "line-frutos", percent: 25 },
      { lineId: "line-festa-leite", percent: 10 },
      { lineId: "line-delicia", percent: 5 },
    ],
  },
  {
    id: "tpl-casamento",
    slug: "casamento",
    name: "Casamento",
    description: "Delícia, Sensa e Frutos — elegância e opções refrescantes para todos os convidados.",
    occasion: "casamento",
    imageUrl: festModelImageUrl("casamento", "casamento"),
    featured: true,
    lines: [
      { lineId: "line-delicia", percent: 30 },
      { lineId: "line-sensa", percent: 25 },
      { lineId: "line-frutos", percent: 20 },
      { lineId: "line-classicos", percent: 15 },
      { lineId: "line-festa-agua", percent: 10 },
    ],
  },
  {
    id: "tpl-corporativo",
    slug: "evento-corporativo",
    name: "Evento corporativo",
    description: "Equilíbrio entre Clássicos, Delícia e opções leves para confraternizações.",
    occasion: "corporativo",
    imageUrl: festModelImageUrl("corporativo", "evento-corporativo"),
    lines: [
      { lineId: "line-classicos", percent: 28 },
      { lineId: "line-delicia", percent: 28 },
      { lineId: "line-meu-sabor", percent: 22 },
      { lineId: "line-festa-agua", percent: 12 },
      { lineId: "line-frutos", percent: 10 },
    ],
  },
  {
    id: "tpl-churrasco",
    slug: "churrasco-confraternizacao",
    name: "Churrasco & confraternização",
    description: "Frutos e Festa Água para refrescar; Clássicos e Fazenda para o paladar cremoso.",
    occasion: "churrasco",
    imageUrl: festModelImageUrl("churrasco", "churrasco-confraternizacao"),
    lines: [
      { lineId: "line-frutos", percent: 30 },
      { lineId: "line-festa-agua", percent: 25 },
      { lineId: "line-classicos", percent: 25 },
      { lineId: "line-fazenda", percent: 20 },
    ],
  },
  {
    id: "tpl-festa-junina",
    slug: "festa-junina",
    name: "Festa junina",
    description: "Clima de arraiá com Clássicos, Meu Sabor, Fazenda e Festa Leite.",
    occasion: "infantil",
    imageUrl: festModelImageUrl("infantil", "festa-junina"),
    lines: [
      { lineId: "line-classicos", percent: 30 },
      { lineId: "line-meu-sabor", percent: 25 },
      { lineId: "line-fazenda", percent: 25 },
      { lineId: "line-festa-leite", percent: 20 },
    ],
  },
];

export const OGGI_STORES_MOCK: OggiStore[] = [
  {
    id: "store-sp-centro",
    name: "Oggi Sorvetes — Centro SP",
    address: "Rua Exemplo, 120",
    city: "São Paulo",
    uf: "SP",
    cep: "01010-000",
    phone: "(11) 3000-0001",
    distanceKm: 2.4,
  },
  {
    id: "store-sp-zona-sul",
    name: "Oggi Sorvetes — Zona Sul",
    address: "Av. das Nações, 450",
    city: "São Paulo",
    uf: "SP",
    cep: "04000-000",
    phone: "(11) 3000-0002",
    distanceKm: 5.1,
  },
  {
    id: "store-rj-barra",
    name: "Oggi Sorvetes — Barra RJ",
    address: "Av. das Américas, 2100",
    city: "Rio de Janeiro",
    uf: "RJ",
    cep: "22640-100",
    phone: "(21) 3000-0003",
    distanceKm: 8.7,
  },
];

export function getIceCreamLineById(id: string): IceCreamLine | undefined {
  return ICE_CREAM_LINES.find((l) => l.id === id);
}

export function getCartModelBySlug(slug: string): FestCartModel | undefined {
  return FEST_CART_MODELS.find((c) => c.slug === slug);
}

export function getCartModelById(id: string): FestCartModel | undefined {
  return FEST_CART_MODELS.find((c) => c.id === id);
}

export function getTemplateBySlug(slug: string): FestTemplate | undefined {
  return FEST_TEMPLATES.find((t) => t.slug === slug);
}

export function getTemplateById(id: string): FestTemplate | undefined {
  return FEST_TEMPLATES.find((t) => t.id === id);
}

/** Aplica modelo na capacidade do carrinho (arredonda e ajusta diferença na maior linha). */
export function buildLinesFromTemplate(
  template: FestTemplate,
  capacity: number,
): { lineId: string; lineName: string; unitPrice: number; quantity: number; imageUrl?: string }[] {
  const raw = template.lines.map((tl) => {
    const line = getIceCreamLineById(tl.lineId);
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

export function festLinesTotal(lines: { unitPrice: number; quantity: number }[]): number {
  return lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
}

export function festLinesUnitCount(lines: { quantity: number }[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/** Produtos complementares (ex.: Porta Picolé). */
export const FEST_ADD_ONS: FestAddOnProduct[] = [
  {
    id: "add-porta-picole",
    slug: "porta-picole",
    name: "Porta Picolé",
    description:
      "Suporte prático para servir picolés no evento — mantém tudo organizado e à mão dos convidados.",
    unitPrice: 24.9,
    imageUrl: "/porta-picole.jpeg",
    upsellAtCheckout: true,
  },
];

export function getFestAddOnById(id: string): FestAddOnProduct | undefined {
  return FEST_ADD_ONS.find((p) => p.id === id);
}

export function getCheckoutUpsellProducts(order: { addOns: { productId: string }[] }): FestAddOnProduct[] {
  const inCart = new Set(order.addOns.map((a) => a.productId));
  return FEST_ADD_ONS.filter((p) => p.upsellAtCheckout && !inCart.has(p.id));
}
