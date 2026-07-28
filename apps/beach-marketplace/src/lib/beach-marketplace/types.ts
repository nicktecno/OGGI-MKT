/**
 * Tipos compartilhados para Beach Marketplace
 * Serão usados tanto no frontend quanto no backend após integração
 */

// ============ BEACH (PRAIA) ============
export interface Beach {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // metros
  description?: string;
  qrCode: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ DISTRIBUIDOR ============
// Cada ambulante é vinculado a um distribuidor. O distribuidor gerencia
// os pontos de referência da(s) praia(s) onde atua.
export interface Distribuidor {
  id: string;
  nome: string;
  telefone?: string;
  beachIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ============ PONTO DE REFERÊNCIA ============
// Cadastrado pelo distribuidor. O cliente pode escolher um ponto de
// referência no lugar de compartilhar a localização exata.
export interface PontoReferencia {
  id: string;
  beachId: string;
  distribuidorId: string;
  nome: string; // ex: "Cadeira 42", "Entrada da praia"
  descricao?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

// ============ AMBULANTE (VENDEDOR) ============
export type AmbullanteStatus = "DISPONIVEL" | "INDISPONIVEL" | "OFFLINE";

export interface Ambulante {
  id: string;
  beachId: string;
  distribuidorId: string;
  nome: string;
  telefone: string;
  fotoPerfil?: string;
  latitude: number;
  longitude: number;
  lastLocationAt: string;
  status: AmbullanteStatus;
  estoque: number; // quantidade de itens disponíveis
  socketId?: string; // para WebSocket (fase 2)
  notificacoesAceitadasCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============ PRODUTO ============
export interface BeachProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: "sorvete" | "picolé" | "bebida" | "outros";
  disponivel: boolean;
}

// ============ CARRINHO / ITEM DO PEDIDO ============
export interface CartItem {
  productId: string;
  product: BeachProduct;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// ============ PEDIDO (ORDER) ============
export type OrderStatus =
  | "PENDENTE"
  | "ACEITO"
  | "EM_PREPARACAO"
  | "PRONTO"
  | "CANCELADO"
  | "NINGUEM_ACEITOU";

export interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
}

// ============ PAGAMENTO (acerto direto com o ambulante, sem gateway) ============
export type PaymentMethod = "PIX" | "CARTAO" | "DINHEIRO";

export interface OrderPayment {
  metodo: PaymentMethod;
  /** Quando DINHEIRO: valor para o qual o cliente precisa de troco (opcional) */
  trocoPara?: number;
}

export interface Order {
  id: string;
  beachId: string;
  clienteNome: string;
  clienteLat: number;
  clienteLon: number;
  clientePhone?: string;
  /** WhatsApp informado pelo cliente para contato/entrega */
  clienteWhatsapp?: string;
  items: OrderItem[];
  ambulanteId?: string;
  ambulante?: Ambulante;
  status: OrderStatus;
  rejectionCount: number;
  ambulanteAttempts: AmbulnanteAttempt[];
  entregueEm?: string;
  totalPrice: number;
  /** Forma de pagamento escolhida (paga direto ao ambulante) */
  pagamento?: OrderPayment;
  /** Ponto de referência escolhido quando o cliente não libera a localização exata */
  pontoReferenciaId?: string;
  pontoReferencia?: string;
  /** Estimativa de entrega em minutos calculada no pedido */
  etaMinutos?: number;
  createdAt: string;
  updatedAt: string;
}

// ============ TENTATIVA DE ACEITAÇÃO ============
export type AttemptStatus = "ENVIADO" | "ACEITO" | "REJEITADO" | "TIMEOUT";

export interface AmbulnanteAttempt {
  id: string;
  orderId: string;
  ambulanteId: string;
  sequencia: number; // 1º, 2º, 3º ambulante...
  status: AttemptStatus;
  respondidoEm?: string;
}

// ============ NOTIFICAÇÃO ============
export type NotificationType = "NOVO_PEDIDO" | "PEDIDO_EXPIRADO" | "PEDIDO_CANCELADO";

export interface Notification {
  id: string;
  ambulanteId: string;
  orderId: string;
  type: NotificationType;
  lido: boolean;
  leroEm?: string;
  createdAt: string;
}

// ============ GEOLOCALIZAÇÃO ============
export interface GeoLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface DistanceResult {
  ambulanteId: string;
  distance: number; // em metros
  ambulante: Ambulante;
}

// ============ RESPOSTA DE API (Será usado em Fase 2) ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============ WEBSOCKET EVENTS (Será usado em Fase 2) ============
export interface WebSocketEvents {
  // Cliente -> Servidor
  "cliente:fazer-pedido": Order;
  "ambulante:aceitar-pedido": { orderId: string; ambulanteId: string };
  "ambulante:rejeitar-pedido": { orderId: string; ambulanteId: string };
  "ambulante:atualizar-localizacao": {
    ambulanteId: string;
    latitude: number;
    longitude: number;
  };

  // Servidor -> Cliente
  "servidor:novo-pedido": Order;
  "servidor:pedido-aceito": { orderId: string; ambulanteId: string };
  "servidor:pedido-rejeitado": { orderId: string; proximoAmbulante?: Ambulante };
  "servidor:pedido-pronto": { orderId: string };
  "servidor:notificacao": Notification;
  "servidor:localizacao-ambulante": { ambulanteId: string; latitude: number; longitude: number };
}
