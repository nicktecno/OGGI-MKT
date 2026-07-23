# Marketplace de Ambulantes na Praia - Plano Arquitetural

## 📋 Visão Geral

Sistema de marketplace para ambulantes na praia com:
- **Cliente**: Lê QR code → Faz pedido → Recebe localização do ambulante
- **Ambulante**: Recebe notificações → Verifica estoque → Aceita/Rejeita → Próximo mais próximo
- **Escalabilidade**: MVP mockado → WebSocket em produção

---

## 🏗️ Arquitetura em Fases

### **FASE 1: MVP Mockado (Frontend)**
- Sem backend/WebSocket
- Dados de ambulantes mockados
- Simulação de aceitação/rejeição
- Geolocalização do navegador

### **FASE 2: Backend + WebSocket**
- API REST para pedidos
- WebSocket para notificações em tempo real
- Database para ambulantes, pedidos, geolocalização
- Sistema de fila de aceitação

### **FASE 3: Produção**
- Autenticação para ambulantes (app mobile)
- Pagamentos integrados
- Analytics e dashboards

---

## 📁 Estrutura de Pastas Proposta

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── praia/
│   │   │   │   ├── page.tsx           # Home com QR scanner
│   │   │   │   └── [beachId]/
│   │   │   │       ├── pedido/
│   │   │   │       │   ├── page.tsx   # Catálogo e pedido
│   │   │   │       │   └── confirmacao/
│   │   │   │       │       └── page.tsx # Status do pedido
│   │   │   │       └── ambulante/
│   │   │   │           └── page.tsx   # Dashboard ambulante
│   │   ├── (ambulante)/
│   │   │   ├── minha-praia/
│   │   │   │   ├── page.tsx           # Dashboard ambulante
│   │   │   │   ├── pedidos/           # Histórico de pedidos
│   │   │   │   └── notificacoes/      # Central de notificações
│   │   │   └── perfil/                # Perfil do ambulante
│   │   └── api/
│   │       ├── praia/
│   │       ├── pedidos/
│   │       ├── ambulantes/
│   │       └── notificacoes/
│   │
│   ├── components/
│   │   ├── beach-marketplace/         # Novo folder
│   │   │   ├── qr-scanner.tsx
│   │   │   ├── beach-catalog.tsx
│   │   │   ├── order-cart.tsx
│   │   │   ├── order-confirmation.tsx
│   │   │   ├── ambulante-map.tsx
│   │   │   ├── ambulante-dashboard.tsx
│   │   │   ├── order-notification.tsx
│   │   │   └── notification-center.tsx
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── beach-marketplace/         # Novo folder
│   │   │   ├── types.ts               # Tipos compartilhados
│   │   │   ├── mock-data.ts           # Dados mockados (FASE 1)
│   │   │   ├── geolocation.ts         # Utilitários de geo
│   │   │   ├── ambulante-finder.ts    # Lógica de encontrar ambulante
│   │   │   ├── order-manager.ts       # Gerenciar pedidos
│   │   │   ├── websocket-client.ts    # Cliente WebSocket (FASE 2)
│   │   │   └── beach-api.ts           # Chamadas API (FASE 2)
│   │   └── ...
│   │
│   └── hooks/
│       ├── use-beach-location.ts
│       ├── use-ambulante-notifications.ts
│       ├── use-order-status.ts
│       └── use-geolocation.ts
│
apps/api/
├── src/
│   ├── beach-marketplace/             # Novo módulo
│   │   ├── beach-marketplace.module.ts
│   │   ├── beach-marketplace.controller.ts
│   │   ├── beach-marketplace.service.ts
│   │   │
│   │   ├── praia/
│   │   │   ├── praia.entity.ts
│   │   │   ├── praia.service.ts
│   │   │   └── praia.controller.ts
│   │   │
│   │   ├── ambulante/
│   │   │   ├── ambulante.entity.ts
│   │   │   ├── ambulante.service.ts
│   │   │   └── ambulante.controller.ts
│   │   │
│   │   ├── pedido/
│   │   │   ├── pedido.entity.ts
│   │   │   ├── pedido.service.ts
│   │   │   └── pedido.controller.ts
│   │   │
│   │   ├── notificacao/
│   │   │   ├── notificacao.gateway.ts (WebSocket)
│   │   │   └── notificacao.service.ts
│   │   │
│   │   └── geolocation/
│   │       ├── geolocation.service.ts
│   │       └── ambulante-matcher.service.ts
│   │
│   └── prisma/
│       ├── schema.prisma               # Adicionar modelos
│       └── migrations/
```

---

## 📊 Modelos de Dados (Prisma Schema)

```prisma
// Beach (Praia)
model Beach {
  id            String   @id @default(cuid())
  name          String
  latitude      Float
  longitude     Float
  radius        Float    @default(500) // metros
  description   String?
  qrCode        String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  ambulantes    Ambulante[]
  pedidos       Order[]
  
  @@map("beaches")
}

// Ambulante (Vendedor)
model Ambulante {
  id            String   @id @default(cuid())
  beachId       String
  beach         Beach    @relation(fields: [beachId], references: [id])
  
  nome          String
  telefone      String
  fotoPerfil    String?
  
  // Localização em tempo real
  latitude      Float
  longitude     Float
  lastLocationAt DateTime @default(now())
  
  // Status
  status        AmbullanteStatus @default(DISPONIVEL) // DISPONIVEL, INDISPONIVEL, OFFLINE
  estoque       Int      @default(0)
  
  // Notificações
  socketId      String?  // Para WebSocket (FASE 2)
  notificacoesAceitadasCount Int @default(0)
  
  pedidos       Order[]
  notificacoes  Notification[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("ambulantes")
}

enum AmbullanteStatus {
  DISPONIVEL
  INDISPONIVEL
  OFFLINE
}

// Order (Pedido)
model Order {
  id            String   @id @default(cuid())
  beachId       String
  beach         Beach    @relation(fields: [beachId], references: [id])
  
  // Cliente
  clienteNome   String
  clienteLat    Float
  clienteLon    Float
  clientePhone  String?
  
  // Produtos
  items         OrderItem[]
  
  // Ambulante designado
  ambulanteId   String?
  ambulante     Ambulante? @relation(fields: [ambulanteId], references: [id])
  
  // Status do pedido
  status        OrderStatus @default(PENDENTE)
  rejectionCount Int      @default(0)
  
  // Histórico de tentativas
  ambulanteAttempts AmbullanteAttempt[]
  
  // Entrega
  entregueEm    DateTime?
  
  // Total
  totalPrice    Float
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("orders")
}

enum OrderStatus {
  PENDENTE           // Aguardando aceitação
  ACEITO             // Ambulante aceitou
  EM_PREPARACAO      // Preparando
  PRONTO             // Pronto para retirar
  CANCELADO          // Cancelado
  NINGUEM_ACEITOU    // Nenhum ambulante aceitou
}

model OrderItem {
  id            String   @id @default(cuid())
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productName   String
  productImage  String?
  quantity      Int
  price         Float
  
  @@map("order_items")
}

model AmbulnanteAttempt {
  id            String   @id @default(cuid())
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  ambulanteId   String
  sequencia     Int      // 1º, 2º, 3º ambulante...
  status        AttemptStatus @default(ENVIADO)
  respondidoEm  DateTime?
  
  @@map("ambulante_attempts")
}

enum AttemptStatus {
  ENVIADO     // Notificação enviada
  ACEITO      // Ambulante aceitou
  REJEITADO   // Ambulante rejeitou
  TIMEOUT     // Não respondeu em X segundos
}

// Notificações
model Notification {
  id            String   @id @default(cuid())
  ambulanteId   String
  ambulante     Ambulante @relation(fields: [ambulanteId], references: [id])
  
  orderId       String
  type          NotificationType
  
  lido          Boolean  @default(false)
  leroEm        DateTime?
  
  createdAt     DateTime @default(now())
  
  @@map("notifications")
}

enum NotificationType {
  NOVO_PEDIDO
  PEDIDO_EXPIRADO
  PEDIDO_CANCELADO
}
```

---

## 🔄 Fluxo de Dados - Fase 1 (Mockado)

```
CLIENTE (Frontend):
1. Acessa /praia
2. Lê QR code (ou digita beachId)
3. Redirecionado para /praia/[beachId]/pedido
4. Vê catálogo de produtos (mockado)
5. Faz pedido
6. Sistema calcula ambulante mais próximo (geolocalização)
7. Simula notificação ao ambulante (1-3 segundos)
8. Ambulante mockado "aceita" automaticamente ou após delay
9. Cliente vê confirmação com localização do ambulante
10. Timeline de status: Pendente → Aceito → Pronto

AMBULANTE (Frontend - Demo):
- Dashboard em /praia/[beachId]/ambulante/dashboard
- Lista de notificações mockadas
- Pode aceitar/rejeitar
- Se rejeitar → passa pro próximo
```

---

## 🚀 Fluxo WebSocket - Fase 2 (Produção)

```
SERVIDOR (NestJS + Socket.IO):

NotificacaoGateway (WebSocket):
- Evento: "novo_pedido" → Envia para ambulante conectado
- Evento: "pedido_aceito" → Atualiza cliente
- Evento: "pedido_rejeitado" → Envia para próximo ambulante
- Evento: "ambulante_localizacao" → Atualiza posição em tempo real
- Evento: "timeout_pedido" → Se ambulante não responder em X seg

CLIENTE (Frontend):
- Socket listener esperando "pedido_aceito" ou "proxima_tentativa"
- Atualiza UI em tempo real
- Mostra localização do ambulante em mapa

AMBULANTE (App Mobile):
- Socket listener esperando "novo_pedido"
- Recebe notificação push + som
- Pode aceitar/rejeitar via UI
- Socket emite "responder_pedido" { orderId, aceito: boolean }
```

---

## 🎨 Identidade Visual - Los Los

Usar o mesmo design system já implementado:
- **Cores**: Rosa Los Los (primária) + brancos/cinzas (cards)
- **Tipografia**: Mesmo font stack
- **Componentes**: Reutilizar `Button`, `Card`, `Badge` do shadcn/ui
- **Iconografia**: lucide-react para QR scanner, mapa, localização

---

## 🔐 Tecnologias - Fase 2+

### Frontend (Próximas atualizações):
- `zustand` - State management para pedidos/notificações
- `socket.io-client` - WebSocket client
- `leaflet` ou `mapbox-gl` - Mapa em tempo real
- `qr-code-scanning` - Leitura de QR code
- `geolocation-api` - GPS do navegador

### Backend (Nova estrutura):
- `@nestjs/websockets` - WebSocket Gateway
- `socket.io` - Servidor WebSocket
- `@nestjs/geoip` ou `geolocation` - Cálculo de distância
- Implementar fila de tentativas com timeout automático

---

## 📱 QR Code Strategy

```typescript
// Cada praia tem um QR code único:
// https://loslos.com/praia/beach-copacabana-001

// Format do QR:
{
  beachId: "beach-copacabana-001",
  beachName: "Copacabana",
  redirectUrl: "https://loslos.com/praia/beach-copacabana-001/pedido"
}
```

---

## 🎯 MVP Mockado - O que precisa ser feito AGORA

### Frontend:
1. Página inicial `/praia` com entrada de QR/beachId
2. Componente QR Scanner
3. Página de catálogo `/praia/[beachId]/pedido`
4. Carrinho de pedido (similar ao Los Los, mas adaptado)
5. Confirmação de pedido com ambulante "mais próximo"
6. Dashboard demo do ambulante (aceitar/rejeitar)
7. Hooks para simular geolocalização e delays

### Backend (Apenas estrutura - Mock):
- Endpoints básicos (listar praias, criar pedido)
- Logica de cálculo de distância mockada
- Não precisa WebSocket ainda

---

## ⚡ Próximos Passos Recomendados

**Semana 1**: Estrutura Frontend MVP
1. Criar pasta `/beach-marketplace`
2. Mock data com 3 praias + 5 ambulantes por praia
3. QR Scanner e redirecionamento
4. Tela de catálogo

**Semana 2**: Fluxo de Pedido
1. Carrinho e checkout
2. Cálculo de ambulante mais próximo
3. Confirmação com geolocalização mockada
4. Dashboard ambulante demo

**Semana 3+**: Backend e WebSocket
1. Implementar database + API
2. WebSocket Gateway
3. Autenticação de ambulantes
4. Notificações em tempo real

---

## 💾 Próximas ações

Quer que eu comece por qual etapa?

- [ ] Criar estrutura de pastas + tipos TypeScript
- [ ] Implementar QR Scanner + página inicial
- [ ] Criar mock data de praias/ambulantes
- [ ] Catálogo de produtos
- [ ] Fluxo de checkout mockado
