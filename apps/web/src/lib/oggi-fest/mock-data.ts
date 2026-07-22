import { festModelImageUrl } from "./brand";
import type {
  FestAddOnProduct,
  FestCartModel,
  FestTemplate,
  IceCreamLine,
  OggiStore,
} from "./types";

/**
 * Catálogo Los Los Fest - Sorvetes Organizados por Categoria
 * PALITOS (18) - Picolés de 90g
 * MINICUPS (5) - Pequenos copinhos
 * CUPS (9) - Copinhos grandes
 */

// ==========================================
// PALITOS - Picolés de 90g (18 sabores)
// ==========================================
const PALITOS: IceCreamLine[] = [
  {
    id: "palito-brigadeiro",
    slug: "brigadeiro",
    name: "Brigadeiro",
    description: "O clássico brasileiro em sorvete. Cremoso, doce e irresistível.",
    unitPrice: 5.2,
    imageUrl: "/loslos/products/brigadeiro.png",
    tags: ["premium", "chocolate"],
    type: "palitos",
  },
  {
    id: "palito-ovomaltine",
    slug: "ovomaltine",
    name: "Ovomaltine®",
    description: "Cremoso, cheio de sabor e com aquele gostinho único do Ovomaltine.",
    unitPrice: 5.9,
    imageUrl: "/loslos/products/ovomaltine.png",
    tags: ["premium", "exclusivo"],
    type: "palitos",
  },
  {
    id: "palito-caramelo",
    slug: "caramelo-crocante",
    name: "Caramelo Crocante com Flor de Sal",
    description: "Combinação perfeita de doce e salgado em massa cremosa.",
    unitPrice: 5.8,
    imageUrl: "/loslos/products/caramelo.png",
    tags: ["premium", "sofisticado"],
    type: "palitos",
  },
  {
    id: "palito-brownie",
    slug: "brownie",
    name: "Brownie",
    description: "Chocolate intenso com pedaços crocantes. Pura indulgência.",
    unitPrice: 5.5,
    imageUrl: "/loslos/products/brownie-site.png",
    tags: ["premium", "chocolate"],
    type: "palitos",
  },
  {
    id: "palito-pistache",
    slug: "pistache-recheado",
    name: "Pistache Recheado",
    description: "Pistache cremoso com recheio surpresa. Sofisticação em sorvete.",
    unitPrice: 6.0,
    imageUrl: "/loslos/products/pistache.png",
    tags: ["premium", "sofisticado"],
    type: "palitos",
  },
  {
    id: "palito-dubai",
    slug: "chocolate-dubai",
    name: "Chocolate Dubai",
    description: "A tendência mundial: chocolate com pistacho e Kadayif crocante.",
    unitPrice: 6.8,
    imageUrl: "/loslos/products/dubai.png",
    tags: ["premium", "sofisticado"],
    type: "palitos",
  },
  {
    id: "palito-speculoos",
    slug: "speculoos",
    name: "Speculoos",
    description: "Biscoito belga em sorvete cremoso com pedaços crocantes.",
    unitPrice: 5.6,
    imageUrl: "/loslos/products/speculoos.png",
    tags: ["premium", "europeu"],
    type: "palitos",
  },
  {
    id: "palito-acai",
    slug: "acai-com-leitinho",
    name: "Açaí com Leitinho",
    description: "Açaí refrescante com toque de leite cremoso.",
    unitPrice: 4.9,
    imageUrl: "/loslos/products/acai.png",
    tags: ["frutas", "refrescante"],
    type: "palitos",
  },
  {
    id: "palito-iogurte",
    slug: "iogurte-frutas-vermelhas",
    name: "Iogurte com Frutas Vermelhas",
    description: "Iogurte cremoso com sabor genuíno de frutas vermelhas.",
    unitPrice: 5.0,
    imageUrl: "/loslos/products/iogurte-frutas.png",
    tags: ["frutas", "leve"],
    type: "palitos",
  },
  {
    id: "palito-coco-zero",
    slug: "coco-branco-zero",
    name: "Coco Branco Zero",
    description: "Coco autêntico com zero açúcar. Tropical e refrescante.",
    unitPrice: 4.8,
    imageUrl: "/loslos/products/coco-branco-zero.png",
    tags: ["zero-açúcar", "tropical"],
    type: "palitos",
  },
  {
    id: "palito-leite-avela",
    slug: "leite-avela",
    name: "Leite com Avelã",
    description: "Leite cremoso com toque de creme de avelã.",
    unitPrice: 5.0,
    imageUrl: "/loslos/products/doce-leite-aviacao.png",
    tags: ["premium", "europeu"],
    type: "palitos",
  },
  {
    id: "palito-morango-leite",
    slug: "morango-leite-condensado",
    name: "Morango com Leite Condensado",
    description: "Morango fresco em massa de leite condensado.",
    unitPrice: 5.1,
    imageUrl: "/loslos/products/morango-leite.png",
    tags: ["frutas", "doce"],
    type: "palitos",
  },
  {
    id: "palito-chocolate-zero",
    slug: "chocolate-zero",
    name: "Chocolate Zero Açúcar",
    description: "Chocolate intenso sem açúcar adicionado.",
    unitPrice: 5.0,
    imageUrl: "/loslos/products/chocolate-zero.png",
    tags: ["zero-açúcar", "chocolate"],
    type: "palitos",
  },
  {
    id: "palito-coco-brigadeiro",
    slug: "coco-brigadeiro",
    name: "Coco com Brigadeiro",
    description: "Coco tropical encontra brigadeiro cremoso.",
    unitPrice: 5.2,
    imageUrl: "/loslos/products/coco-brigadeiro.png",
    tags: ["tropical", "chocolate"],
    type: "palitos",
  },
  {
    id: "palito-maracuja",
    slug: "maracuja-leite-condensado",
    name: "Maracujá com Leite Condensado",
    description: "Sabor tropical do maracujá em sorvete refrescante.",
    unitPrice: 5.0,
    imageUrl: "/loslos/products/maracuja-leite.png",
    tags: ["frutas", "tropical"],
    type: "palitos",
  },
  {
    id: "palito-cheesecake",
    slug: "cheesecake-morango",
    name: "Cheesecake de Morango",
    description: "Cream cheese cremosíssimo com compota de morango.",
    unitPrice: 5.3,
    imageUrl: "/loslos/products/cheesecake-morango.png",
    tags: ["frutas", "premium"],
    type: "palitos",
  },
  {
    id: "palito-banoffee",
    slug: "banoffee-nanica",
    name: "Banoffee Nanica",
    description: "Banana caramelizada com biscoito e doce de leite.",
    unitPrice: 5.7,
    imageUrl: "/loslos/products/caramelo.png",
    tags: ["frutas", "banana"],
    type: "palitos",
  },
  {
    id: "palito-nutty",
    slug: "nutty-bavarian",
    name: "Nutty Bavarian",
    description: "Avelã cremosa com chocolate e avelã crocante.",
    unitPrice: 5.6,
    imageUrl: "/loslos/products/nutty-bavarian.png",
    tags: ["premium", "europeu"],
    type: "palitos",
  },
];

// ==========================================
// MINICUPS - Pequenos copinhos (5 sabores)
// ==========================================
const MINICUPS: IceCreamLine[] = [
  {
    id: "mini-nutty",
    slug: "nutty-bavarian-mini",
    name: "Nutty Bavarian",
    description: "Avelã cremosa com chocolate e avelã crocante.",
    unitPrice: 4.5,
    imageUrl: "/loslos/products/nutty-bavarian.png",
    tags: ["premium", "europeu"],
    type: "minicups",
  },
  {
    id: "mini-7belo",
    slug: "7belo-mini",
    name: "7Belo",
    description: "Sete camadas de chocolate e avelã em perfeita harmonia.",
    unitPrice: 4.3,
    imageUrl: "/loslos/products/7belo.png",
    tags: ["premium", "chocolate"],
    type: "minicups",
  },
  {
    id: "mini-doce-leite",
    slug: "doce-leite-aviacao-mini",
    name: "Doce de Leite Aviação",
    description: "Doce de leite premium com toque de café.",
    unitPrice: 4.7,
    imageUrl: "/loslos/products/doce-leite-aviacao.png",
    tags: ["premium", "doce"],
    type: "minicups",
  },
  {
    id: "mini-ovomaltine",
    slug: "ovomaltine-mini",
    name: "Ovomaltine®",
    description: "Cremoso e cheio de sabor em porção pequena.",
    unitPrice: 4.6,
    imageUrl: "/loslos/products/ovomaltine.png",
    tags: ["premium", "exclusivo"],
    type: "minicups",
  },
  {
    id: "mini-banoffee",
    slug: "banoffee-nanica-mini",
    name: "Banoffee Nanica",
    description: "Banana caramelizada com biscoito e doce de leite.",
    unitPrice: 4.8,
    imageUrl: "/loslos/products/caramelo.png",
    tags: ["frutas", "banana"],
    type: "minicups",
  },
];

// ==========================================
// CUPS - Copinhos grandes (9 sabores)
// ==========================================
const CUPS: IceCreamLine[] = [
  {
    id: "cup-brownie",
    slug: "brownie-cup",
    name: "Brownie",
    description: "Chocolate intenso com pedaços crocantes. Pura indulgência.",
    unitPrice: 5.8,
    imageUrl: "/loslos/products/brownie-site.png",
    tags: ["premium", "chocolate"],
    type: "cups",
  },
  {
    id: "cup-cheesecake",
    slug: "cheesecake-morango-cup",
    name: "Cheesecake de Morango",
    description: "Cream cheese cremosíssimo com compota de morango.",
    unitPrice: 6.0,
    imageUrl: "/loslos/products/cheesecake-morango.png",
    tags: ["frutas", "premium"],
    type: "cups",
  },
  {
    id: "cup-chocolate-zero",
    slug: "chocolate-zero-cup",
    name: "Chocolate Zero Açúcar",
    description: "Chocolate intenso sem açúcar adicionado.",
    unitPrice: 5.5,
    imageUrl: "/loslos/products/chocolate-zero.png",
    tags: ["zero-açúcar", "chocolate"],
    type: "cups",
  },
  {
    id: "cup-doce-leite",
    slug: "doce-leite-aviacao-cup",
    name: "Doce de Leite Aviação",
    description: "Doce de leite premium com toque de café.",
    unitPrice: 6.2,
    imageUrl: "/loslos/products/doce-leite-aviacao.png",
    tags: ["premium", "doce"],
    type: "cups",
  },
  {
    id: "cup-7belo",
    slug: "7belo-cup",
    name: "7Belo",
    description: "Sete camadas de chocolate e avelã em perfeita harmonia.",
    unitPrice: 5.6,
    imageUrl: "/loslos/products/7belo.png",
    tags: ["premium", "chocolate"],
    type: "cups",
  },
  {
    id: "cup-leite-avela",
    slug: "leite-avela-cup",
    name: "Leite com Avelã",
    description: "Leite cremoso com toque de creme de avelã.",
    unitPrice: 5.5,
    imageUrl: "/loslos/products/doce-leite-aviacao.png",
    tags: ["premium", "europeu"],
    type: "cups",
  },
  {
    id: "cup-nutty",
    slug: "nutty-bavarian-cup",
    name: "Nutty Bavarian",
    description: "Avelã cremosa com chocolate e avelã crocante.",
    unitPrice: 6.0,
    imageUrl: "/loslos/products/nutty-bavarian.png",
    tags: ["premium", "europeu"],
    type: "cups",
  },
  {
    id: "cup-ovomaltine",
    slug: "ovomaltine-cup",
    name: "Ovomaltine®",
    description: "Cremoso, cheio de sabor em generosa porção.",
    unitPrice: 6.1,
    imageUrl: "/loslos/products/ovomaltine.png",
    tags: ["premium", "exclusivo"],
    type: "cups",
  },
  {
    id: "cup-banoffee",
    slug: "banoffee-nanica-cup",
    name: "Banoffee Nanica",
    description: "Banana caramelizada com biscoito e doce de leite.",
    unitPrice: 6.0,
    imageUrl: "/loslos/products/caramelo.png",
    tags: ["frutas", "banana"],
    type: "cups",
  },
];

// ==========================================
// EXPORTAR CATÁLOGO COMPLETO
// ==========================================
export const ICE_CREAM_LINES: IceCreamLine[] = [
  ...PALITOS,
  ...MINICUPS,
  ...CUPS,
];

export const FEST_CART_MODELS: FestCartModel[] = [
  {
    id: "cart-200",
    slug: "carrinho-200",
    name: "Carrinho Los Los",
    capacity: 200,
    description:
      "Ideal para festas médias. Inclui placas de gel para manter a temperatura por cerca de 4 horas. Com guarda-sol e buzina exclusivos Los Los!",
    imageUrl: "/loslos/carrinho-novo.png",
    rentalIncluded: true,
  },
  {
    id: "cart-300",
    slug: "carrinho-300",
    name: "Freezer Los Los",
    capacity: 300,
    description:
      "Para eventos maiores — freezer com capacidade ampliada e mesmo padrão Los Los de qualidade. Mantém os sorvetes perfeitos por toda a festa.",
    imageUrl: "/loslos/freezer-novo.png",
    rentalIncluded: true,
  },
];

export const FEST_TEMPLATES: FestTemplate[] = [
  {
    id: "tpl-aniversario",
    slug: "aniversario-infantil",
    name: "Aniversário infantil",
    description: "Mix colorido com os sabores que a criançada ama.",
    occasion: "aniversario",
    imageUrl: festModelImageUrl("aniversario", "aniversario-infantil"),
    featured: true,
    lines: [
      { lineId: "palito-brigadeiro", percent: 30 },
      { lineId: "palito-banoffee", percent: 25 },
      { lineId: "palito-dubai", percent: 20 },
      { lineId: "palito-ovomaltine", percent: 15 },
      { lineId: "palito-morango-leite", percent: 10 },
    ],
  },
  {
    id: "tpl-casamento",
    slug: "casamento",
    name: "Casamento",
    description: "Elegância e sofisticação com os melhores sabores premium.",
    occasion: "casamento",
    imageUrl: festModelImageUrl("casamento", "casamento"),
    featured: true,
    lines: [
      { lineId: "palito-dubai", percent: 30 },
      { lineId: "palito-pistache", percent: 25 },
      { lineId: "palito-caramelo", percent: 20 },
      { lineId: "palito-ovomaltine", percent: 15 },
      { lineId: "palito-cheesecake", percent: 10 },
    ],
  },
  {
    id: "tpl-corporativo",
    slug: "evento-corporativo",
    name: "Evento corporativo",
    description: "Equilíbrio entre sabores clássicos e refrescantes.",
    occasion: "corporativo",
    imageUrl: festModelImageUrl("corporativo", "evento-corporativo"),
    lines: [
      { lineId: "palito-brigadeiro", percent: 25 },
      { lineId: "palito-ovomaltine", percent: 25 },
      { lineId: "palito-leite-avela", percent: 20 },
      { lineId: "palito-iogurte", percent: 15 },
      { lineId: "palito-acai", percent: 15 },
    ],
  },
  {
    id: "tpl-churrasco",
    slug: "churrasco-confraternizacao",
    name: "Churrasco & confraternização",
    description: "Sabores refrescantes para aliviar o calor.",
    occasion: "churrasco",
    imageUrl: festModelImageUrl("churrasco", "churrasco-confraternizacao"),
    lines: [
      { lineId: "palito-acai", percent: 25 },
      { lineId: "palito-maracuja", percent: 25 },
      { lineId: "palito-coco-zero", percent: 20 },
      { lineId: "palito-brownie", percent: 20 },
      { lineId: "palito-iogurte", percent: 10 },
    ],
  },
  {
    id: "tpl-festa-junina",
    slug: "festa-junina",
    name: "Festa junina",
    description: "Clima de arraiá com sabores tradicionais.",
    occasion: "infantil",
    imageUrl: festModelImageUrl("infantil", "festa-junina"),
    lines: [
      { lineId: "palito-doce-leite", percent: 25 },
      { lineId: "palito-banoffee", percent: 25 },
      { lineId: "palito-coco-brigadeiro", percent: 20 },
      { lineId: "palito-brigadeiro", percent: 15 },
      { lineId: "palito-morango-leite", percent: 15 },
    ],
  },
];

export const OGGI_STORES: OggiStore[] = [
  {
    id: "store-consolacao",
    name: "Loja Consolação",
    address: "Rua Consolação, 123",
    city: "São Paulo",
    uf: "SP",
    cep: "01311-100",
    phone: "(11) 3222-1234",
  },
  {
    id: "store-pinheiros",
    name: "Loja Pinheiros",
    address: "Rua Bandeira Paulista, 500",
    city: "São Paulo",
    uf: "SP",
    cep: "01311-100",
    phone: "(11) 3222-5678",
  },
];

// Utility functions
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

export const OGGI_STORES_MOCK = OGGI_STORES;

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
