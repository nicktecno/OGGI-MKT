/**
 * Mock Data para MVP - Beach Marketplace
 * Em produção (Fase 2), virá da API
 */

import { Beach, Ambulante, BeachProduct } from "./types";

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

// ============ AMBULANTES ============
export const MOCK_AMBULANTES: Ambulante[] = [
  // Copacabana
  {
    id: "ambulante-copa-001",
    beachId: "beach-copacabana-001",
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
  {
    id: "prod-sorvete-morango",
    name: "Sorvete Morango",
    description: "Cremoso e refrescante",
    price: 8.9,
    imageUrl: "/loslos/products/morango-leite.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-sorvete-chocolate",
    name: "Sorvete Chocolate",
    description: "Delicioso chocolate derretido",
    price: 8.9,
    imageUrl: "/loslos/products/chocolate.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-sorvete-baunilha",
    name: "Sorvete Baunilha",
    description: "Clássico e delicado",
    price: 7.9,
    imageUrl: "/loslos/products/doce-leite-aviacao.png",
    category: "sorvete",
    disponivel: true,
  },
  {
    id: "prod-picole-frutas",
    name: "Picolé de Frutas",
    description: "Mix de frutas tropicais",
    price: 6.9,
    imageUrl: "/loslos/products/framboesa.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-picole-limao",
    name: "Picolé de Limão",
    description: "Refrescante e ácido",
    price: 5.9,
    imageUrl: "/loslos/products/limonada.png",
    category: "picolé",
    disponivel: true,
  },
  {
    id: "prod-agua-coconut",
    name: "Água de Coco",
    description: "Água fresca direto do coco",
    price: 12.9,
    imageUrl: "/loslos/products/coco-branco-zero.png",
    category: "bebida",
    disponivel: true,
  },
  {
    id: "prod-agua-suco",
    name: "Suco Natural",
    description: "Suco de laranja natural",
    price: 9.9,
    imageUrl: "/loslos/products/manga.png",
    category: "bebida",
    disponivel: true,
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
