# Beach Marketplace - Guia de Implementação do Backend (Fase 2+)

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Backend](#arquitetura-do-backend)
3. [Banco de Dados](#banco-de-dados)
4. [APIs REST](#apis-rest)
5. [WebSocket](#websocket)
6. [Integração Frontend-Backend](#integração-frontend-backend)
7. [Fluxos Detalhados](#fluxos-detalhados)
8. [Implementação Step-by-Step](#implementação-step-by-step)

---

## 🎯 Visão Geral

O backend implementará:
- **API REST** para operações CRUD (praias, ambulantes, pedidos)
- **WebSocket (Socket.IO)** para notificações em tempo real
- **Geolocalização** para encontrar ambulantes mais próximos
- **Fila de aceitação** com timeout automático
- **Autenticação** para ambulantes (JWT)

**Stack proposto:**
- NestJS (framework)
- Prisma (ORM)
- Socket.IO (WebSocket)
- PostgreSQL (database)
- Redis (cache + sessions)

---

## 🏗️ Arquitetura do Backend

```
apps/api/src/
├── beach-marketplace/
│   ├── beach-marketplace.module.ts          # Módulo principal
│   ├── beach-marketplace.controller.ts      # Rotas públicas
│   ├── beach-marketplace.service.ts         # Orquestração
│   │
│   ├── praia/                               # Recursos de praia
│   │   ├── praia.entity.ts
│   │   ├── praia.service.ts
│   │   ├── praia.controller.ts
│   │   └── praia.module.ts
│   │
│   ├── ambulante/                           # Recursos de ambulante
│   │   ├── ambulante.entity.ts
│   │   ├── ambulante.service.ts
│   │   ├── ambulante.controller.ts
│   │   ├── ambulante.module.ts
│   │   └── ambulante-auth.guard.ts
│   │
│   ├── pedido/                              # Recursos de pedido
│   │   ├── pedido.entity.ts
│   │   ├── pedido.service.ts
│   │   ├── pedido.controller.ts
│   │   ├── pedido.module.ts
│   │   └── pedido-queue.service.ts         # Fila de aceitação
│   │
│   ├── notificacao/                         # WebSocket + Notificações
│   │   ├── notificacao.gateway.ts           # Socket.IO Gateway
│   │   ├── notificacao.service.ts
│   │   ├── notificacao.module.ts
│   │   └── notificacao-eventos.ts           # Tipos de eventos
│   │
│   ├── geolocation/                         # Cálculos de distância
│   │   ├── geolocation.service.ts
│   │   ├── ambulante-matcher.service.ts     # Find nearest
│   │   └── geolocation.module.ts
│   │
│   └── shared/
│       ├── dtos/                             # Data Transfer Objects
│       ├── guards/                           # Autenticação/Autorização
│       ├── interceptors/
│       └── pipes/
│
└── prisma/
    ├── schema.prisma                        # Models (Ver próxima seção)
    └── migrations/
```

---

## 💾 Banco de Dados (Prisma Schema)

### Adicionar ao `apps/api/prisma/schema.prisma`:

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
  imageUrl      String?
  active        Boolean  @default(true)
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
  
  // Autenticação (Fase 2+)
  email         String   @unique
  password      String   // hash bcrypt
  refreshToken  String?
  
  nome          String
  telefone      String
  fotoPerfil    String?
  documento     String?  // CPF
  
  // Localização em tempo real
  latitude      Float
  longitude     Float
  lastLocationAt DateTime @default(now())
  
  // Status
  status        AmbullanteStatus @default(DISPONIVEL)
  estoque       Int      @default(0)
  
  // Socket.IO
  socketId      String?  // ID da conexão WebSocket ativa
  
  // Ratings
  notificacoesAceitadasCount Int @default(0)
  pedidosCancelados Int @default(0)
  ratingMedio   Float    @default(5.0)
  
  pedidos       Order[]
  notificacoes  Notification[]
  tentativas    AmbulnanteAttempt[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("ambulantes")
  @@index([beachId])
  @@index([status])
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
  
  // Status
  status        OrderStatus @default(PENDENTE)
  rejectionCount Int      @default(0)
  
  // Timeline
  tentativas    AmbulnanteAttempt[]
  
  // Datas importantes
  criadoEm      DateTime @default(now())
  aceitoEm      DateTime?
  prontoEm      DateTime?
  entregueEm    DateTime?
  
  // Total
  totalPrice    Float
  
  updatedAt     DateTime @updatedAt
  
  @@map("orders")
  @@index([beachId])
  @@index([status])
  @@index([ambulanteId])
}

enum OrderStatus {
  PENDENTE           // Aguardando aceitação
  ACEITO             // Ambulante aceitou
  EM_PREPARACAO      // Preparando
  PRONTO             // Pronto para retirar
  ENTREGUE           // Entregue
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

// Tentativa de Aceitação
model AmbulnanteAttempt {
  id            String   @id @default(cuid())
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  ambulanteId   String
  ambulante     Ambulante @relation(fields: [ambulanteId], references: [id])
  
  sequencia     Int      // 1º, 2º, 3º ambulante...
  status        AttemptStatus @default(ENVIADO)
  respondidoEm  DateTime?
  respostaEm    DateTime @default(now())
  
  @@map("ambulante_attempts")
  @@index([orderId])
  @@index([ambulanteId])
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
  ambulante     Ambulante @relation(fields: [ambulanteId], references: [id], onDelete: Cascade)
  
  orderId       String
  type          NotificationType
  titulo        String
  descricao     String?
  
  lido          Boolean  @default(false)
  lidoEm        DateTime?
  
  createdAt     DateTime @default(now())
  
  @@map("notifications")
  @@index([ambulanteId])
  @@index([lido])
}

enum NotificationType {
  NOVO_PEDIDO
  PEDIDO_EXPIRADO
  PEDIDO_CANCELADO
}
```

### Migration:
```bash
# Adicionar models ao schema.prisma e depois:
npx prisma migrate dev --name add_beach_marketplace
```

---

## 🔌 APIs REST

### Endpoints Públicos (Cliente)

```
POST   /api/praia
       Listar praias disponíveis

POST   /api/praia/:beachId/ambulantes-proximos
       Body: { latitude, longitude }
       Retorna: Array<Ambulante> (ordenado por distância)

POST   /api/pedido
       Body: {
         beachId: string;
         clienteNome: string;
         clienteLat: number;
         clienteLon: number;
         clientePhone?: string;
         items: Array<{ productId: string; quantity: number }>;
       }
       Retorna: Order

GET    /api/pedido/:orderId
       Retorna status do pedido
```

### Endpoints para Ambulante (Autenticado)

```
POST   /api/ambulante/auth/login
       Body: { email, password }
       Retorna: { accessToken, refreshToken, ambulante }

POST   /api/ambulante/auth/refresh
       Retorna novo accessToken

GET    /api/ambulante/me
       Retorna dados do ambulante logado

PATCH  /api/ambulante/localizacao
       Body: { latitude, longitude }
       Atualiza localização em tempo real

GET    /api/ambulante/pedidos-pendentes
       Retorna lista de pedidos aguardando resposta

POST   /api/ambulante/pedido/:orderId/aceitar
       Aceita um pedido

POST   /api/ambulante/pedido/:orderId/rejeitar
       Rejeita um pedido

GET    /api/ambulante/notificacoes
       Lista notificações do ambulante
```

---

## 🔌 WebSocket (Socket.IO)

### Namespaces e Eventos

#### Cliente → Servidor

```typescript
// Namespace: /beach-marketplace

// Cliente conectando para monitorar pedido
socket.emit("cliente:monitorar-pedido", { orderId: string })

// Ambulante conectando/update de localização
socket.emit("ambulante:conectar", { ambulanteId: string, token: string })
socket.emit("ambulante:atualizar-localizacao", { latitude, longitude })

// Ambulante respondendo a pedido
socket.emit("ambulante:aceitar-pedido", { orderId: string })
socket.emit("ambulante:rejeitar-pedido", { orderId: string })

// Ambulante saindo offline
socket.emit("ambulante:desconectar", {})
```

#### Servidor → Cliente

```typescript
// Para cliente monitorando pedido
socket.emit("pedido:aceito", { orderId, ambulante })
socket.emit("pedido:rejeitado", { orderId, proximoAmbulante })
socket.emit("pedido:pronto", { orderId })
socket.emit("pedido:cancelado", { orderId, motivo })

// Para ambulante
socket.emit("novo-pedido", { pedido: Order, sequencia: number })
socket.emit("pedido-expirou", { orderId })
socket.emit("ambulante-proximo-aceitou", { orderId, ambulante })

// Broadcast
socket.broadcast.emit("ambulante-online", { ambulante })
socket.broadcast.emit("ambulante-offline", { ambulanteId })
```

---

## 🔄 Fluxo Detalhado - Cliente Fazendo Pedido

```
1. Cliente acessa /praia/[beachId]/pedido
   → Frontend faz GET /api/praia/:beachId (pega info da praia)

2. Cliente seleciona produtos e faz checkout
   → Frontend chama POST /api/pedido
   
3. Backend recebe pedido:
   - Cria Order (status: PENDENTE)
   - Busca ambulantes disponíveis no raio
   - Ordena por distância + rating
   - Retorna Order com ambulante sugerido

4. Frontend recebe confirmação
   - Conecta ao WebSocket: socket.emit("cliente:monitorar-pedido", { orderId })
   - Mostra tela de "Aguardando resposta"

5. Backend inicia NotificacaoGateway:
   - Envia evento "novo-pedido" para ambulante mais próximo
   - Cria AmbulnanteAttempt (sequencia: 1, status: ENVIADO)
   - Inicia timeout (30 segundos)

6. Ambulante recebe notificação:
   - Socket emite "novo-pedido" → App atualiza
   - Ambulante decide aceitar/rejeitar

7A. Ambulante Aceita:
   - Emite: socket.emit("ambulante:aceitar-pedido", { orderId })
   - Backend atualiza: Order.status = ACEITO, Order.ambulanteId = ambulante.id
   - Broadcast para cliente: socket.emit("pedido:aceito", { })
   - Cria Notification para ambulante

7B. Ambulante Rejeita OU Timeout:
   - Se rejeita: socket.emit("ambulante:rejeitar-pedido")
   - Backend atualiza AmbulnanteAttempt.status = REJEITADO
   - Se há próximo ambulante disponível:
     * Envia evento "novo-pedido" para 2º ambulante (sequencia: 2)
     * Repete fluxo de espera
   - Se não há mais ambulantes:
     * Order.status = NINGUEM_ACEITOU
     * Notifica cliente

8. Cliente vê confirmação:
   - Nome, foto e localização do ambulante
   - Mapa com posição em tempo real (socket atualiza periodicamente)
   - Status: ACEITO → EM_PREPARACAO → PRONTO
```

---

## 🔄 Fluxo Detalhado - Atualização de Localização em Tempo Real

```
1. Ambulante abre app e aceita pedido
   - Conecta ao WebSocket: socket.emit("ambulante:conectar", { token })
   - Backend armazena socketId no documento Ambulante

2. Ambulante se move na praia
   - App envia geolocalização periodicamente (a cada 5 segundos)
   - socket.emit("ambulante:atualizar-localizacao", { latitude, longitude })

3. Backend recebe atualização:
   - Atualiza Ambulante.latitude, Ambulante.longitude, Ambulante.lastLocationAt
   - Encontra todos os pedidos ACEITOS deste ambulante
   - Para cada pedido:
     * Encontra clientes monitorando (seus sockets)
     * Emite "localizacao-ambulante" com coords atualizadas

4. Frontend do cliente recebe update:
   - Atualiza posição no mapa
   - Mostra distância em tempo real
   - Anima movimento do marcador
```

---

## 📊 Implementação Step-by-Step

### Passo 1: Setup do Projeto Backend

```bash
# Já tem NestJS em apps/api, adicionar:
npm install -w apps/api @nestjs/websockets socket.io socket.io-client
npm install -w apps/api @prisma/client
npm install -w apps/api bcrypt jwt jsonwebtoken
npm install -w apps/api geolib  # Para cálculos de distância

# Tipos
npm install -w apps/api -D @types/node
```

### Passo 2: Implementar Modelos Prisma

1. Adicionar models ao `schema.prisma`
2. Criar migration: `npx prisma migrate dev --name add_beach_marketplace`
3. Executar seed com dados mockados (copy do mock-data.ts frontend)

### Passo 3: Estrutura de Pastas

```bash
mkdir -p apps/api/src/beach-marketplace/{praia,ambulante,pedido,notificacao,geolocation,shared}
mkdir -p apps/api/src/beach-marketplace/shared/{dtos,guards,interceptors}
```

### Passo 4: Implementar Services (na ordem)

1. **PraiaService**: CRUD simples
2. **GeolocationService**: Calcular distâncias (reusar código do frontend)
3. **AmbullanteService**: CRUD + autenticação
4. **PedidoService**: Criar pedido, encontrar ambulantes
5. **NotificacaoService**: Gerenciar notificações + timeout
6. **AmbullanteMatcherService**: Lógica de encontrar próximos ambulantes
7. **PedidoQueueService**: Gerenciar fila de aceitação com timeout

### Passo 5: Implementar Controllers

1. **PraiaController**: GET /praia, GET /praia/:id
2. **AmbullanteController**: GET /ambulante, PATCH localização
3. **PedidoController**: POST /pedido, GET /pedido/:id
4. **AuthController**: POST /auth/login, POST /auth/refresh

### Passo 6: Implementar Gateway WebSocket

```typescript
// NotificacaoGateway
@WebSocketGateway({ namespace: 'beach-marketplace' })
export class NotificacaoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @SubscribeMessage('cliente:monitorar-pedido')
  handleClientMonitor(client: Socket, data: { orderId: string }) {
    // Adiciona client a room: `pedido-${orderId}`
  }

  @SubscribeMessage('ambulante:conectar')
  handleAmbullanteConnect(client: Socket, data: { ambulanteId: string, token: string }) {
    // Valida token JWT
    // Atualiza Ambulante.socketId
    // Adiciona a room: `ambulante-${ambulanteId}`
  }

  @SubscribeMessage('ambulante:atualizar-localizacao')
  handleLocationUpdate(client: Socket, data: { latitude, longitude }) {
    // Atualiza Ambulante geo
    // Broadcast para clientes monitorando pedidos deste ambulante
  }

  @SubscribeMessage('ambulante:aceitar-pedido')
  handleAcceptOrder(client: Socket, data: { orderId: string }) {
    // Atualiza Order.status = ACEITO
    // Emite para cliente: "pedido:aceito"
  }

  @SubscribeMessage('ambulante:rejeitar-pedido')
  handleRejectOrder(client: Socket, data: { orderId: string }) {
    // Atualiza AmbulnanteAttempt.status = REJEITADO
    // Chama PedidoQueueService para próxima tentativa
  }
}
```

### Passo 7: Implementar Lógica de Fila (PedidoQueueService)

```typescript
// Quando um ambulante rejeita ou timeout:
// 1. Busca próximo ambulante no array de tentativas
// 2. Envia notificação via WebSocket (novo-pedido)
// 3. Cria novo AmbulnanteAttempt(sequencia: 2)
// 4. Inicia novo timeout (30 seg)
// 5. Se sem resposta/rejeita → próximo
// 6. Se esgotou ambulantes → Order.status = NINGUEM_ACEITOU

async processNextAttempt(orderId: string) {
  const order = await this.orderService.findOne(orderId);
  const tentativas = await this.attemptService.findAll(orderId);
  const proximoSequencia = tentativas.length + 1;
  
  const proximoAmbulante = await this.findNextAvailableAmbulante(order, tentativas);
  
  if (!proximoAmbulante) {
    // Ninguém aceitou
    order.status = 'NINGUEM_ACEITOU';
    await this.orderService.update(orderId, order);
    this.notificacaoGateway.emitToCliente(orderId, 'pedido:ninguem-aceitou');
    return;
  }
  
  // Notifica novo ambulante
  await this.createAttempt(orderId, proximoAmbulante.id, proximoSequencia);
  this.notificacaoGateway.notifyAmbulante(proximoAmbulante.socketId, 'novo-pedido', order);
  
  // Inicia timeout
  setTimeout(() => this.handleTimeout(orderId, proximoSequencia), 30000);
}
```

### Passo 8: Autenticação

```typescript
// AmbullanteAuthGuard
@Injectable()
export class AmbullanteAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    
    try {
      const decoded = this.jwtService.verify(token);
      request.ambulante = decoded;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

### Passo 9: Integração no Frontend

Adicionar a cliente Socket.IO ao frontend (Fase 2):

```typescript
// apps/web/src/lib/beach-marketplace/websocket-client.ts
import io from 'socket.io-client';

export const beachMarketplaceSocket = io(
  process.env.NEXT_PUBLIC_API_URL,
  {
    namespace: '/beach-marketplace',
    autoConnect: false,
  }
);
```

### Passo 10: Testes

```bash
# Testes unitários
npm run test -- beach-marketplace

# Testes e2e
npm run test:e2e -- beach-marketplace
```

---

## 🚨 Considerações Importantes

### Performance
- Usar índices no BD para queries de localização
- Cache de ambulantes por praia (Redis)
- Limpar sockets desconectados
- Batch updates de localização (não a cada segundo)

### Escalabilidade
- Usar Redis para sessions de Socket.IO (quando múltiplos servidores)
- Considerar separar WebSocket em servidor dedicado
- Queue de jobs (Bull) para processamento assíncrono

### Segurança
- JWT com refresh token
- Validar localização do ambulante (distância máxima)
- Rate limiting em endpoints
- CORS configurado corretamente

### Logging
- Registrar eventos importantes (nova tentativa, timeout, aceito)
- Usar Winston/Pino para logs estruturados

---

## 📱 Próximos: App Mobile do Ambulante

Após implementar backend, criar app nativa (React Native/Flutter) para ambulante:
- Notificações push (Firebase Cloud Messaging)
- GPS background tracking
- Interface otimizada para 1 mão
- Modo offline + sync

---

## ✅ Checklist de Implementação

- [ ] Modelos Prisma criados
- [ ] Migration executada
- [ ] Seed data insertado
- [ ] GeolocationService pronto
- [ ] PraiaService pronto
- [ ] AmbullanteService com autenticação
- [ ] PedidoService com lógica de pedido
- [ ] NotificacaoGateway WebSocket pronto
- [ ] PedidoQueueService com timeout
- [ ] Endpoints REST testados
- [ ] WebSocket testado com cliente
- [ ] Rate limiting implementado
- [ ] Logging estruturado
- [ ] Documentação de API (OpenAPI/Swagger)

---

**Status**: Documentação preparada para Fase 2  
**Início recomendado**: Após MVP Fase 1 estar validado em produção
