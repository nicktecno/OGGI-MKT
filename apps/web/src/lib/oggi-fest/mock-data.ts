import { festModelImageUrl } from "./brand";
import type {
  FestAddOnProduct,
  FestCartModel,
  FestTemplate,
  IceCreamLine,
  OggiStore,
} from "./types";

/**
 * Catálogo completo Sorvetes Los Los (30+ sabores)
 * Extraído de sorvetesloslos.com.br/sabores/palitos/, minicups/, cups/
 * Organizado por categorias para facilitar a montagem de festas
 */
export const ICE_CREAM_LINES: IceCreamLine[] = [
  // ===== ESPECIALIDADES PREMIUM - Sabores Destaque =====
  // ===== ESPECIALIDADES PREMIUM - Sabores Destaque =====
  {
    id: "line-brigadeiro",
    slug: "brigadeiro-palito",
    name: "Brigadeiro",
    description: "O clássico brasileiro em sorvete. Cremoso, doce e irresistível — pura nostalgia.",
    unitPrice: 5.2,
    imageUrl: "/loslos/products/brigadeiro.png",
    tags: ["premium", "chocolate", "clássico"],
  },
  {
    id: "line-ovomaltine",
    slug: "ovomaltine-palito",
    name: "Ovomaltine®",
    description: "Nosso sorvete de Ovomaltine em uma palavra? Magnífico! Cremoso e cheio de sabor.",
    unitPrice: 5.9,
    imageUrl: "/loslos/products/ovomaltine.png",
    tags: ["premium", "exclusivo"],
  },
  {
    id: "line-caramelo-flor-sal",
    slug: "caramelo-crocante-com-flor-de-sal-palito",
    name: "Caramelo Crocante com Flor de Sal",
    description: "Combinação perfeita de doce e salgado. Caramelo crocante em massa cremosa — sofisticação em sorvete.",
    unitPrice: 5.8,
    imageUrl: "/loslos/products/caramelo.png",
    tags: ["premium", "sofisticado"],
  },
  {
    id: "line-brownie",
    slug: "brownie-palito",
    name: "Brownie",
    description: "Sorvete de brownie de chocolate intenso com pedaços crocantes. Pura indulgência.",
    unitPrice: 5.5,
    imageUrl: "/loslos/products/brownie-site.png",
    tags: ["premium", "chocolate"],
  },
  {
    id: "line-pistache-recheado",
    slug: "pistache-recheado",
    name: "Pistache Recheado",
    description: "Pistache na massa e no recheio para quem ama se esbaldar. A novidade que virou Los Los!",
    unitPrice: 6.5,
    imageUrl: "/loslos/products/pistache.png",
    tags: ["premium", "exclusivo"],
  },
  {
    id: "line-chocolate-dubai",
    slug: "chocolate-dubai-palito",
    name: "Chocolate Dubai",
    description: "A tendência mundial feita Los Los: chocolate com pistacho e Kadayif. Muito recheio, zero miséria.",
    unitPrice: 6.8,
    imageUrl: "/loslos/products/dubai.png",
    tags: ["premium", "tendência"],
  },
  {
    id: "line-speculoos",
    slug: "speculoos-palito",
    name: "Speculoos",
    description: "Biscoito Speculoos belga em sorvete. Autêntico, cremoso e com pedaços crocantes.",
    unitPrice: 5.6,
    imageUrl: "/loslos/products/speculoos.png",
    tags: ["premium", "importado"],
  },
  {
    id: "line-nutty-bavarian",
    slug: "nutty-bavarian-palito",
    name: "Nutty Bavarian",
    description: "Combinação europeia: castanhas, chocolate e caramelo em perfeita harmonia.",
    unitPrice: 5.7,
    imageUrl: "/loslos/products/nutty-bavarian.png",
    tags: ["premium", "europeu"],
  },
  {
    id: "line-7belo",
    slug: "7belo-palito",
    name: "7Belo",
    description: "Aquele sabor nostálgico em formato sorvete. Cremoso e repleto de memórias.",
    unitPrice: 5.4,
    imageUrl: "/loslos/products/7belo.png",
    tags: ["premium", "clássico"],
  },
  {
    id: "line-banoffee-nanica",
    slug: "banoffee-nanica-palito",
    name: "Banoffee Nanica",
    description: "A parceria Los Los + Nanica: banana caramelizada e toffee em sorvete cremoso.",
    unitPrice: 5.9,
    imageUrl: "/loslos/products/banoffee-nanica.png",
    tags: ["premium", "banana"],
  },
  {
    id: "line-doce-leite",
    slug: "doce-de-leite-aviacao-palito",
    name: "Doce de Leite Aviação",
    description: "Sorvete de doce de leite com aquela cremosidade e sabor que todo brasileiro ama.",
    unitPrice: 4.8,
    imageUrl: "/loslos/products/doce-leite-aviacao.png",
    tags: ["premium", "lácteo"],
  },

  // ===== FRUTAS & REFRESCANTES =====
  {
    id: "line-acai-leitinho",
    slug: "acai-com-leitinho",
    name: "Açaí com Leitinho",
    description: "Sabor refrescante e nutritivo. Açaí puro com toque de leite cremoso.",
    unitPrice: 4.8,
    imageUrl: "/loslos/products/acai.png",
    tags: ["frutas", "refrescante"],
  },
  {
    id: "line-iogurte-frutas",
    slug: "iogurte-com-frutas-vermelhas",
    name: "Iogurte com Frutas Vermelhas",
    description: "Iogurte cremoso com sabor genuíno de frutas vermelhas. Leve e saudável.",
    unitPrice: 4.6,
    imageUrl: "/loslos/products/iogurte-frutas.png",
    tags: ["frutas", "leve"],
  },
  {
    id: "line-maracuja-leite",
    slug: "maracuja-com-leite-condensado-palito",
    name: "Maracujá com Leite Condensado",
    description: "Sabor tropical do maracujá em sorvete refrescante com leite condensado. Pura fruta!",
    unitPrice: 4.7,
    imageUrl: "/loslos/products/maracuja-leite.png",
    tags: ["frutas", "tropical"],
  },
  {
    id: "line-cheesecake-morango",
    slug: "cheesecake-de-morango-palito",
    name: "Cheesecake de Morango",
    description: "Cream cheese cremosíssimo e compota de fruta de verdade. Vai resistir?",
    unitPrice: 5.3,
    imageUrl: "/loslos/products/cheesecake-morango.png",
    tags: ["frutas", "premium"],
  },
  {
    id: "line-morango-leite",
    slug: "morango-com-leite-condensado-palito",
    name: "Morango com Leite Condensado",
    description: "Morango fresco em massa de leite condensado. Doce, cremoso e irresistível.",
    unitPrice: 4.9,
    imageUrl: "/loslos/products/morango-leite.png",
    tags: ["frutas", "doce"],
  },
  {
    id: "line-framboesa-choco",
    slug: "framboesa-com-chocolates",
    name: "Framboesa com Chocolates",
    description: "Framboesa ácida em contraste com chocolates cremosos. Elegância e sofisticação.",
    unitPrice: 5.2,
    imageUrl: "/loslos/products/framboesa.png",
    tags: ["frutas", "premium"],
  },
  {
    id: "line-manga",
    slug: "manga",
    name: "Manga",
    description: "Tropical, doce e refrescante. O sabor da manga em todo seu esplendor.",
    unitPrice: 4.6,
    imageUrl: "/loslos/products/manga.png",
    tags: ["frutas", "tropical"],
  },
  {
    id: "line-limonada",
    slug: "limonada",
    name: "Limonada",
    description: "Refrescante e cítrico. Perfeito para dias quentes e festas ao ar livre.",
    unitPrice: 4.4,
    imageUrl: "/loslos/products/limonada.png",
    tags: ["frutas", "refrescante"],
  },

  // ===== CLÁSSICOS & LÁCTEOS =====
  {
    id: "line-leite-avela",
    slug: "leite-com-creme-de-avela-palito",
    name: "Leite com Creme de Avelã",
    description: "Combinação irresistível de leite cremoso com recheio de creme de avelã.",
    unitPrice: 5.4,
    imageUrl: "/loslos/products/leite-avela.png",
    tags: ["lácteo", "premium"],
  },
  {
    id: "line-coco-branco-zero",
    slug: "coco-branco-zero",
    name: "Coco Branco Zero",
    description: "Coco autêntico com zero açúcar. Tropical e refrescante para quem cuida da saúde.",
    unitPrice: 4.5,
    imageUrl: "/loslos/products/coco-branco-zero.png",
    tags: ["zero-açúcar", "tropical"],
  },
  {
    id: "line-coco-brigadeiro",
    slug: "coco-com-brigadeiro-palito",
    name: "Coco com Brigadeiro",
    description: "Dupla fantástica: coco tropical encontra brigadeiro cremoso em uma experiência inesperada.",
    unitPrice: 5.2,
    imageUrl: "/loslos/products/coco-brigadeiro.png",
    tags: ["lácteo", "chocolate"],
  },
  {
    id: "line-coco-antigamente",
    slug: "coco-feito-como-antigamente",
    name: "Coco Feito Como Antigamente",
    description: "Resgate do coco clássico, aquele feito com ingredientes nobres e muito carinho.",
    unitPrice: 4.7,
    imageUrl: "/loslos/products/chocolate.png",
    tags: ["lácteo", "clássico"],
  },

  // ===== ZERO AÇÚCAR & LIGHT =====
  {
    id: "line-chocolate-zero",
    slug: "chocolate-zero-acucar-palito",
    name: "Chocolate Zero Açúcar",
    description: "Chocolate intenso sem perder o sabor. Perfeito para quem não abre mão do chocolate.",
    unitPrice: 4.5,
    imageUrl: "/loslos/products/chocolate-zero.png",
    tags: ["zero-açúcar", "chocolate"],
  },

  // ===== CLÁSSICOS & ÚNICOS =====
  {
    id: "line-chocolate-palito",
    slug: "chocolate-palito",
    name: "Chocolate",
    description: "O clássico irresistível. Massa de chocolate intensa e cremosa que conquista todo mundo.",
    unitPrice: 4.5,
    imageUrl: "/loslos/products/chocolate.png",
    tags: ["clássico", "chocolate"],
  },
  {
    id: "line-uva-classico",
    slug: "uva-classico",
    name: "Uva Clássico",
    description: "Aquele violeta gostoso que remete à infância. Simples, puro e gostoso.",
    unitPrice: 4.3,
    imageUrl: "/loslos/products/chocolate.png",
    tags: ["clássico", "frutas"],
  },
  {
    id: "line-milho-verde",
    slug: "milho-verde-da-fazenda",
    name: "Milho Verde da Fazenda",
    description: "Sabor único e delicado. Milho verde colhido na hora, cremoso e nutritivo.",
    unitPrice: 4.5,
    imageUrl: "/loslos/products/milho-verde.png",
    tags: ["exclusivo", "único"],
  },
  {
    id: "line-mini-saia",
    slug: "mini-saia",
    name: "Mini Saia",
    description: "Aquele doce nostálgico em versão sorvete. Reminiscência e cremosidade.",
    unitPrice: 4.4,
    imageUrl: "/loslos/products/mini-saia.png",
    tags: ["clássico", "doce"],
  },

  // ===== VEGANOS =====
  {
    id: "line-ovomaltine-vegano",
    slug: "ovomaltine-vegano",
    name: "Ovomaltine Vegano",
    description: "Toda a magia do Ovomaltine® em versão 100% vegana. Sem perder o sabor!",
    unitPrice: 5.9,
    imageUrl: "/loslos/products/ovomaltine.png",
    tags: ["vegano", "exclusivo"],
  },
  {
    id: "line-acai-vegano",
    slug: "acai-vegano-palito",
    name: "Açaí Vegano",
    description: "Açaí refrescante em versão vegana. Mantém toda a qualidade e sabor Los Los.",
    unitPrice: 4.8,
    imageUrl: "/loslos/products/acai.png",
    tags: ["vegano", "frutas"],
  },
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
    imageUrl: "/loslos/carrinho-novo.png",
    rentalIncluded: true,
  },
];

export const FEST_TEMPLATES: FestTemplate[] = [
  {
    id: "tpl-aniversario",
    slug: "aniversario-infantil",
    name: "Aniversário infantil",
    description: "Mix colorido e doce com os sabores que a criançada ama — Brigadeiro, Banoffee e Chocolate!",
    occasion: "aniversario",
    imageUrl: festModelImageUrl("aniversario", "aniversario-infantil"),
    featured: true,
    lines: [
      { lineId: "line-brigadeiro", percent: 30 },
      { lineId: "line-banoffee-nanica", percent: 25 },
      { lineId: "line-chocolate-dubai", percent: 20 },
      { lineId: "line-ovomaltine", percent: 15 },
      { lineId: "line-morango-leite", percent: 10 },
    ],
  },
  {
    id: "tpl-casamento",
    slug: "casamento",
    name: "Casamento",
    description: "Elegância e sofisticação: Chocolate Dubai, Pistache e os melhores sabores premium Los Los.",
    occasion: "casamento",
    imageUrl: festModelImageUrl("casamento", "casamento"),
    featured: true,
    lines: [
      { lineId: "line-chocolate-dubai", percent: 30 },
      { lineId: "line-pistache-recheado", percent: 25 },
      { lineId: "line-caramelo-flor-sal", percent: 20 },
      { lineId: "line-ovomaltine", percent: 15 },
      { lineId: "line-cheesecake-morango", percent: 10 },
    ],
  },
  {
    id: "tpl-corporativo",
    slug: "evento-corporativo",
    name: "Evento corporativo",
    description: "Equilíbrio entre sabores clássicos e refrescantes para confraternizações.",
    occasion: "corporativo",
    imageUrl: festModelImageUrl("corporativo", "evento-corporativo"),
    lines: [
      { lineId: "line-brigadeiro", percent: 25 },
      { lineId: "line-ovomaltine", percent: 25 },
      { lineId: "line-leite-avela", percent: 20 },
      { lineId: "line-iogurte-frutas", percent: 15 },
      { lineId: "line-acai-leitinho", percent: 15 },
    ],
  },
  {
    id: "tpl-churrasco",
    slug: "churrasco-confraternizacao",
    name: "Churrasco & confraternização",
    description: "Sabores refrescantes e cremosos para aliviar o calor: Açaí, Maracujá e Coco.",
    occasion: "churrasco",
    imageUrl: festModelImageUrl("churrasco", "churrasco-confraternizacao"),
    lines: [
      { lineId: "line-acai-leitinho", percent: 25 },
      { lineId: "line-maracuja-leite", percent: 25 },
      { lineId: "line-coco-branco-zero", percent: 20 },
      { lineId: "line-brownie", percent: 20 },
      { lineId: "line-iogurte-frutas", percent: 10 },
    ],
  },
  {
    id: "tpl-festa-junina",
    slug: "festa-junina",
    name: "Festa junina",
    description: "Clima de arraiá com sabores tradicionais: Doce de Leite, Banoffee e clássicos que remetem à festa.",
    occasion: "infantil",
    imageUrl: festModelImageUrl("infantil", "festa-junina"),
    lines: [
      { lineId: "line-doce-leite", percent: 30 },
      { lineId: "line-banoffee-nanica", percent: 25 },
      { lineId: "line-coco-com-brigadeiro", percent: 20 },
      { lineId: "line-brigadeiro", percent: 15 },
      { lineId: "line-morango-leite", percent: 10 },
    ],
  },
];

export const OGGI_STORES_MOCK: OggiStore[] = [
  {
    id: "store-sp-vila-andrade",
    name: "Sorvetes Los Los — Vila Andrade",
    address: "R. Maria José da Conceição, 555",
    city: "São Paulo",
    uf: "SP",
    cep: "05730-170",
    phone: "(11) 5588-3433",
    distanceKm: 0,
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
