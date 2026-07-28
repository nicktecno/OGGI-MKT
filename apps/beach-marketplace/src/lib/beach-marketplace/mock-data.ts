/**
 * Mock Data para MVP - Beach Marketplace
 * Em produção (Fase 2), virá da API
 */

import { Beach, Ambulante, BeachProduct, Order, Distribuidor, PontoReferencia } from "./types";

// ============ PRAIAS ============
export const MOCK_BEACHES: Beach[] = [
  {
    id: "beach-copacabana-001",
    name: "Copacabana",
    latitude: -22.98667,
    longitude: -43.18277,
    radius: 800,
    description: "Praia de Copacabana, Rio de Janeiro",
    qrCode: "https://loslos.com/praia/beach-copacabana-001",
    imageUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=500&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "beach-ipanema-001",
    name: "Ipanema",
    latitude: -22.98306,
    longitude: -43.20242,
    radius: 800,
    description: "Praia de Ipanema, Rio de Janeiro",
    qrCode: "https://loslos.com/praia/beach-ipanema-001",
    imageUrl: "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800&h=500&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "beach-leblon-001",
    name: "Leblon",
    latitude: -22.98427,
    longitude: -43.22236,
    radius: 800,
    description: "Praia do Leblon, Rio de Janeiro",
    qrCode: "https://loslos.com/praia/beach-leblon-001",
    imageUrl: "https://images.unsplash.com/photo-1544989164-31dc3c645987?w=800&h=500&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============ DISTRIBUIDORES ============
// Cada ambulante é vinculado a um distribuidor, que gerencia os pontos
// de referência da(s) praia(s) onde atua.
export const MOCK_DISTRIBUIDORES: Distribuidor[] = [
  {
    id: "dist-los-copa",
    nome: "Los Los Copacabana",
    telefone: "(21) 3333-0001",
    beachIds: ["beach-copacabana-001"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "dist-los-ipa",
    nome: "Los Los Ipanema",
    telefone: "(21) 3333-0002",
    beachIds: ["beach-ipanema-001"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "dist-los-leb",
    nome: "Los Los Leblon",
    telefone: "(21) 3333-0003",
    beachIds: ["beach-leblon-001"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============ PONTOS DE REFERÊNCIA ============
// Cadastrados pelo distribuidor. O cliente pode escolher um destes no
// lugar de compartilhar a localização exata.
export const MOCK_PONTOS_REFERENCIA: PontoReferencia[] = [
  {
    id: "ref-copa-entrada",
    beachId: "beach-copacabana-001",
    distribuidorId: "dist-los-copa",
    nome: "Entrada da praia (Posto 3)",
    descricao: "Próximo à travessia principal do Posto 3",
    latitude: -22.9862,
    longitude: -43.1828,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref-copa-quiosque",
    beachId: "beach-copacabana-001",
    distribuidorId: "dist-los-copa",
    nome: "Quiosque do João",
    descricao: "Quiosque em frente ao Posto 4",
    latitude: -22.9875,
    longitude: -43.1835,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref-copa-guardasol",
    beachId: "beach-copacabana-001",
    distribuidorId: "dist-los-copa",
    nome: "Guarda-sol Los Los (fileira 2)",
    descricao: "Guarda-sol com tag Los Los, segunda fileira",
    latitude: -22.9868,
    longitude: -43.182,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref-ipa-posto9",
    beachId: "beach-ipanema-001",
    distribuidorId: "dist-los-ipa",
    nome: "Posto 9",
    descricao: "Clássico ponto de encontro do Posto 9",
    latitude: -22.9835,
    longitude: -43.2058,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref-ipa-arpoador",
    beachId: "beach-ipanema-001",
    distribuidorId: "dist-los-ipa",
    nome: "Pedra do Arpoador",
    descricao: "Início da praia, próximo ao Arpoador",
    latitude: -22.9885,
    longitude: -43.1935,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref-leb-baixo",
    beachId: "beach-leblon-001",
    distribuidorId: "dist-los-leb",
    nome: "Baixão do Leblon",
    descricao: "Ponto central do Leblon",
    latitude: -22.9862,
    longitude: -43.2225,
    createdAt: new Date().toISOString(),
  },
];

// ============ AMBULANTES ============
export const MOCK_AMBULANTES: Ambulante[] = [
  // Copacabana
  {
    id: "ambulante-copa-001",
    beachId: "beach-copacabana-001",
    distribuidorId: "dist-los-copa",
    nome: "João da Praia",
    telefone: "(21) 98888-0001",
    fotoPerfil: "https://i.pravatar.cc/150?img=1",
    latitude: -22.986,
    longitude: -43.182,
    lastLocationAt: new Date().toISOString(),
    status: "DISPONIVEL",
    estoque: 45,
    notificacoesAceitadasCount: 127,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ambulante-copa-002",
    beachId: "beach-copacabana-001",
    distribuidorId: "dist-los-copa",
    nome: "Maria Sorvetes",
    telefone: "(21) 98888-0002",
    fotoPerfil: "https://i.pravatar.cc/150?img=2",
    latitude: -22.987,
    longitude: -43.183,
    lastLocationAt: new Date().toISOString(),
    status: "DISPONIVEL",
    estoque: 52,
    notificacoesAceitadasCount: 98,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ambulante-copa-003",
    beachId: "beach-copacabana-001",
    distribuidorId: "dist-los-copa",
    nome: "Pedro Picolé",
    telefone: "(21) 98888-0003",
    fotoPerfil: "https://i.pravatar.cc/150?img=3",
    latitude: -22.985,
    longitude: -43.184,
    lastLocationAt: new Date().toISOString(),
    status: "INDISPONIVEL",
    estoque: 0,
    notificacoesAceitadasCount: 64,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ambulante-copa-004",
    beachId: "beach-copacabana-001",
    distribuidorId: "dist-los-copa",
    nome: "Ana Gelado",
    telefone: "(21) 98888-0004",
    fotoPerfil: "https://i.pravatar.cc/150?img=4",
    latitude: -22.989,
    longitude: -43.181,
    lastLocationAt: new Date().toISOString(),
    status: "DISPONIVEL",
    estoque: 38,
    notificacoesAceitadasCount: 112,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ambulante-copa-005",
    beachId: "beach-copacabana-001",
    distribuidorId: "dist-los-copa",
    nome: "Carlos Paleteiro",
    telefone: "(21) 98888-0005",
    fotoPerfil: "https://i.pravatar.cc/150?img=5",
    latitude: -22.984,
    longitude: -43.186,
    lastLocationAt: new Date().toISOString(),
    status: "DISPONIVEL",
    estoque: 41,
    notificacoesAceitadasCount: 89,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Ipanema
  {
    id: "ambulante-ipa-001",
    beachId: "beach-ipanema-001",
    distribuidorId: "dist-los-ipa",
    nome: "Roberto Frio",
    telefone: "(21) 98888-1001",
    fotoPerfil: "https://i.pravatar.cc/150?img=6",
    latitude: -22.983,
    longitude: -43.202,
    lastLocationAt: new Date().toISOString(),
    status: "DISPONIVEL",
    estoque: 55,
    notificacoesAceitadasCount: 142,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ambulante-ipa-002",
    beachId: "beach-ipanema-001",
    distribuidorId: "dist-los-ipa",
    nome: "Fernanda Doces",
    telefone: "(21) 98888-1002",
    fotoPerfil: "https://i.pravatar.cc/150?img=7",
    latitude: -22.984,
    longitude: -43.203,
    lastLocationAt: new Date().toISOString(),
    status: "DISPONIVEL",
    estoque: 48,
    notificacoesAceitadasCount: 105,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Leblon
  {
    id: "ambulante-leb-001",
    beachId: "beach-leblon-001",
    distribuidorId: "dist-los-leb",
    nome: "Thiago Geleia",
    telefone: "(21) 98888-2001",
    fotoPerfil: "https://i.pravatar.cc/150?img=8",
    latitude: -22.985,
    longitude: -43.222,
    lastLocationAt: new Date().toISOString(),
    status: "DISPONIVEL",
    estoque: 43,
    notificacoesAceitadasCount: 156,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============ PRODUTOS ============
export const MOCK_PRODUCTS: BeachProduct[] = [
  // Palitos
  {
    id: "prod-palito-brigadeiro",
    name: "Brigadeiro",
    description: "O clássico brasileiro em sorvete. Cremoso, doce e irresistível.",
    price: 5.2,
    imageUrl: "/loslos/products/palito-brigadeiro.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-palito-ovomaltine",
    name: "Ovomaltine®",
    description: "Cremoso, cheio de sabor e com aquele gostinho único do Ovomaltine.",
    price: 5.9,
    imageUrl: "/loslos/products/palito-ovomaltine.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-palito-caramelo",
    name: "Caramelo Crocante com Flor de Sal",
    description: "Combinação perfeita de doce e salgado em massa cremosa.",
    price: 5.8,
    imageUrl: "/loslos/products/palito-caramelo.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-palito-brownie",
    name: "Brownie",
    description: "Chocolate intenso com pedaços crocantes. Pura indulgência.",
    price: 5.5,
    imageUrl: "/loslos/products/palito-brownie.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-palito-pistache",
    name: "Pistache Recheado",
    description: "Pistache cremoso com recheio surpresa. Sofisticação em sorvete.",
    price: 6.0,
    imageUrl: "/loslos/products/palito-pistache.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-palito-dubai",
    name: "Chocolate Dubai",
    description: "A tendência mundial: chocolate com pistacho e Kadayif crocante.",
    price: 6.8,
    imageUrl: "/loslos/products/palito-dubai.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-palito-speculoos",
    name: "Speculoos",
    description: "Biscoito belga em sorvete cremoso com pedaços crocantes.",
    price: 5.6,
    imageUrl: "/loslos/products/palito-speculoos.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-acai",
    name: "Açaí com Leitinho",
    description: "Açaí refrescante com toque de leite cremoso.",
    price: 4.9,
    imageUrl: "/loslos/products/acai.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-iogurte-frutas",
    name: "Iogurte com Frutas Vermelhas",
    description: "Iogurte cremoso com sabor genuíno de frutas vermelhas.",
    price: 5.0,
    imageUrl: "/loslos/products/iogurte-frutas.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-coco-zero",
    name: "Coco Branco Zero",
    description: "Coco autêntico com zero açúcar. Tropical e refrescante.",
    price: 4.8,
    imageUrl: "/loslos/products/coco-branco-zero.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-leite-avela",
    name: "Leite com Avelã",
    description: "Leite cremoso com toque de creme de avelã.",
    price: 5.0,
    imageUrl: "/loslos/products/doce-leite-aviacao.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-morango-leite",
    name: "Morango com Leite Condensado",
    description: "Morango fresco em massa de leite condensado.",
    price: 5.1,
    imageUrl: "/loslos/products/morango-leite.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-chocolate-zero",
    name: "Chocolate Zero Açúcar",
    description: "Chocolate intenso sem açúcar adicionado.",
    price: 5.0,
    imageUrl: "/loslos/products/chocolate-zero.png",
    category: "sorvete",
    disponivel: true,
  },
  // Mini Cups
  {
    id: "prod-minicup-nutty",
    name: "Nutty Bavarian",
    description: "Avelã cremosa com chocolate e avelã crocante.",
    price: 4.5,
    imageUrl: "/loslos/products/minicup-nutty.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-minicup-7belo",
    name: "7Belo",
    description: "Sete camadas de chocolate e avelã em perfeita harmonia.",
    price: 4.3,
    imageUrl: "/loslos/products/minicup-7belo.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-minicup-aviacao",
    name: "Doce de Leite Aviação",
    description: "Doce de leite premium com toque de café.",
    price: 4.7,
    imageUrl: "/loslos/products/minicup-aviacao.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-minicup-ovomaltine",
    name: "Ovomaltine®",
    description: "Cremoso e cheio de sabor em porção pequena.",
    price: 4.6,
    imageUrl: "/loslos/products/minicup-ovomaltine.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-minicup-banoffee",
    name: "Banoffee Nanica",
    description: "Banana caramelizada com biscoito e doce de leite.",
    price: 4.8,
    imageUrl: "/loslos/products/minicup-banoffee.png",
    category: "picolé",
    disponivel: true,
  },
  // Cups
  {
    id: "prod-cup-brownie",
    name: "Brownie",
    description: "Chocolate intenso com pedaços crocantes. Pura indulgência.",
    price: 5.8,
    imageUrl: "/loslos/products/cup-brownie.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-cup-cheesecake",
    name: "Cheesecake de Morango",
    description: "Cream cheese cremosíssimo com compota de morango.",
    price: 6.0,
    imageUrl: "/loslos/products/cup-cheesecake.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-cup-chocolate-zero",
    name: "Chocolate Zero Açúcar",
    description: "Chocolate intenso sem açúcar adicionado.",
    price: 5.5,
    imageUrl: "/loslos/products/cup-chocolate-zero.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-cup-aviacao",
    name: "Doce de Leite Aviação",
    description: "Doce de leite premium com toque de café.",
    price: 6.2,
    imageUrl: "/loslos/products/cup-aviacao.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-cup-7belo",
    name: "7Belo",
    description: "Sete camadas de chocolate e avelã em perfeita harmonia.",
    price: 5.6,
    imageUrl: "/loslos/products/cup-7belo.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-cup-leite-avela",
    name: "Leite com Avelã",
    description: "Leite cremoso com toque de creme de avelã.",
    price: 5.5,
    imageUrl: "/loslos/products/cup-leite-avela.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-cup-nutty",
    name: "Nutty Bavarian",
    description: "Avelã cremosa com chocolate e avelã crocante.",
    price: 6.0,
    imageUrl: "/loslos/products/cup-nutty.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-cup-ovomaltine",
    name: "Ovomaltine®",
    description: "Cremoso, cheio de sabor em generosa porção.",
    price: 6.1,
    imageUrl: "/loslos/products/cup-ovomaltine.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-cup-banoffee",
    name: "Banoffee Nanica",
    description: "Banana caramelizada com biscoito e doce de leite.",
    price: 6.0,
    imageUrl: "/loslos/products/cup-banoffee.png",
    category: "bebida",
    disponivel: true,
  },
];

// ============ PEDIDOS MOCK ============
export const MOCK_ORDERS: Order[] = [
  {
    id: "order-001",
    beachId: "beach-copacabana-001",
    clienteNome: "Lucas Mendes",
    clienteLat: -22.9862,
    clienteLon: -43.1825,
    clientePhone: "(21) 99999-1111",
    items: [
      { id: "oi-001", productName: "Brigadeiro", productImage: "/loslos/products/palito-brigadeiro.png", quantity: 2, price: 5.2 },
      { id: "oi-002", productName: "Ovomaltine®", productImage: "/loslos/products/palito-ovomaltine.png", quantity: 1, price: 5.9 },
    ],
    ambulanteId: "ambulante-copa-001",
    status: "ACEITO",
    rejectionCount: 0,
    ambulanteAttempts: [],
    totalPrice: 16.3,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: "order-002",
    beachId: "beach-copacabana-001",
    clienteNome: "Ana Paula",
    clienteLat: -22.987,
    clienteLon: -43.183,
    clientePhone: "(21) 99999-2222",
    items: [
      { id: "oi-003", productName: "Chocolate Dubai", productImage: "/loslos/products/palito-dubai.png", quantity: 1, price: 6.8 },
    ],
    status: "PENDENTE",
    rejectionCount: 0,
    ambulanteAttempts: [],
    totalPrice: 6.8,
    createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
  {
    id: "order-003",
    beachId: "beach-copacabana-001",
    clienteNome: "Rodrigo Silva",
    clienteLat: -22.9855,
    clienteLon: -43.184,
    clientePhone: "(21) 99999-3333",
    items: [
      { id: "oi-004", productName: "Nutty Bavarian", productImage: "/loslos/products/minicup-nutty.png", quantity: 3, price: 4.5 },
      { id: "oi-005", productName: "Cheesecake de Morango", productImage: "/loslos/products/cup-cheesecake.png", quantity: 1, price: 6.0 },
    ],
    ambulanteId: "ambulante-copa-001",
    status: "PRONTO",
    rejectionCount: 0,
    ambulanteAttempts: [],
    entregueEm: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    totalPrice: 19.5,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: "order-004",
    beachId: "beach-copacabana-001",
    clienteNome: "Mariana Costa",
    clienteLat: -22.986,
    clienteLon: -43.182,
    clientePhone: "(21) 99999-4444",
    items: [
      { id: "oi-006", productName: "Açaí com Leitinho", productImage: "/loslos/products/acai.png", quantity: 2, price: 4.9 },
    ],
    ambulanteId: "ambulante-copa-001",
    status: "PRONTO",
    rejectionCount: 0,
    ambulanteAttempts: [],
    entregueEm: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    totalPrice: 9.8,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

// ============ HELPERS ============
export function getBeachById(beachId: string): Beach | undefined {
  return MOCK_BEACHES.find((b) => b.id === beachId);
}

export function getAmbulantesbyBeach(beachId: string): Ambulante[] {
  return MOCK_AMBULANTES.filter((a) => a.beachId === beachId);
}

export function getAmbullanteById(ambulanteId: string): Ambulante | undefined {
  return MOCK_AMBULANTES.find((a) => a.id === ambulanteId);
}

export function getProductById(productId: string): BeachProduct | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === productId);
}

export function getProductsByCategory(category: BeachProduct["category"]): BeachProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.category === category && p.disponivel);
}

export function getDistribuidorById(distribuidorId: string): Distribuidor | undefined {
  return MOCK_DISTRIBUIDORES.find((d) => d.id === distribuidorId);
}

export function getPontosReferenciaByBeach(beachId: string): PontoReferencia[] {
  return MOCK_PONTOS_REFERENCIA.filter((p) => p.beachId === beachId);
}

export function getPontoReferenciaById(id: string): PontoReferencia | undefined {
  return MOCK_PONTOS_REFERENCIA.find((p) => p.id === id);
}

export function getAmbulantesByDistribuidor(distribuidorId: string): Ambulante[] {
  return MOCK_AMBULANTES.filter((a) => a.distribuidorId === distribuidorId);
}
