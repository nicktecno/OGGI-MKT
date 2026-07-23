# Beach Marketplace - MVP Fase 1

## 📱 O que foi implementado

### ✅ Frontend Completo (Mockado)

- **QR Scanner**: Página inicial com entrada de QR code e seleção de praia
- **Catálogo de Produtos**: Produtos categorizados (sorvetes, picolés, bebidas)
- **Carrinho**: Add/remove itens, atualizar quantidade, cálculo de total
- **Checkout Mockado**: Simula envio de notificação ao ambulante
- **Confirmação de Pedido**: Mostra ambulante mais próximo com status em tempo real
- **Dashboard de Ambulante**: Demo para aceitar/rejeitar pedidos

### 🗂️ Estrutura de Código

```
apps/web/src/
├── components/beach-marketplace/
│   ├── qr-scanner.tsx                  # Entrada de QR code
│   ├── beach-catalog.tsx               # Lista de produtos
│   ├── beach-cart.tsx                  # Carrinho
│   ├── order-confirmation.tsx          # Status do pedido
│   └── ambulante-dashboard.tsx         # Dashboard (demo)
│
├── lib/beach-marketplace/
│   ├── types.ts                        # Tipos compartilhados ✨
│   ├── mock-data.ts                    # Dados mockados (substituir por API em Fase 2)
│   ├── geolocation.ts                  # Cálculos de distância ✨
│   └── (websocket-client.ts)           # A implementar em Fase 2
│
└── hooks/beach-marketplace/
    └── index.ts                        # Hooks customizados ✨
        ├── useGeolocation()            # Localização do cliente
        ├── useNearestAmbulantes()      # Encontrar próximos
        ├── useOrderNotificationSimulation()  # Simula notificação
        ├── useBeachCart()              # Estado do carrinho
        └── useSimulatedDelay()         # Mock de API delay
```

**✨ = Código reutilizável para Fase 2+**

---

## 🚀 Como Usar o MVP Fase 1

### Acessar as Praias

1. Ir para `/praia`
2. Ver lista de praias disponíveis: **Copacabana**, **Ipanema**, **Leblon**
3. Clicar em uma praia para entrar
4. Ou digitar o código QR/ID no campo de entrada

### Fazer um Pedido

1. Após selecionar praia, vai para catálogo (`/praia/[beachId]/pedido`)
2. Ver produtos categorizados
3. Adicionar ao carrinho clicando no botão de compra
4. Abrir carrinho lateral (botão no topo)
5. Revisar itens e clicar "Finalizar Pedido"

### Ver Confirmação de Pedido

1. Após finalizar, sistema simula envio para ambulante
2. Mostra animação de "Enviando notificação..." → "Aguardando resposta..."
3. Simula resposta após 2-5 segundos (70% chance de aceitar)
4. Se aceitar: mostra dados do ambulante
5. Se rejeitar: tenta próximo ambulante automaticamente
6. Até 3 tentativas antes de "Ninguém aceitou"

### Ver Dashboard de Ambulante (Demo)

1. Ir para `/praia/[beachId]/ambulante`
2. Ver notificações de pedidos mockadas
3. Clicar "Aceitar" ou "Rejeitar"
4. Simula processamento por 1-2 segundos
5. Dashboard atualiza status

---

## 🔄 Arquitetura Fase 1 → Fase 2

### O que Permanece

- ✅ Tipos TypeScript (`types.ts`)
- ✅ Funções de geolocalização (`geolocation.ts`)
- ✅ Estrutura de componentes
- ✅ Hooks customizados (com pequenas adaptações)

### O que Muda

| Aspecto | Fase 1 (Agora) | Fase 2 (Backend) |
|--------|---|---|
| Dados | Mock em `mock-data.ts` | API REST + Database |
| Geolocalização | Calcula no frontend | Backend encontra ambulantes |
| Notificações | Mockadas com setTimeout | WebSocket em tempo real |
| Localização ambulante | Estática | GPS em tempo real (Socket.IO) |
| Autenticação | Nenhuma | JWT para ambulantes |
| Persistência | LocalStorage | PostgreSQL |

---

## 📁 Próximas Páginas/Rotas

Para integração com backend, criar:

```
/praia/[beachId]/
├── pedido/              ← Existe (MVP)
├── confirmacao/         ← Criar: Status do pedido em tempo real
└── ambulante/           ← Existe como demo

/ambulante/
├── dashboard/           ← Criar: Dashboard real (app mobile em Fase 3)
├── notificacoes/        ← Criar: Central de notificações
├── pedidos/             ← Criar: Histórico de pedidos aceitos
└── perfil/              ← Criar: Dados pessoais/estoque
```

---

## 🔧 Implementação de Fase 2: Step-by-Step

### 1️⃣ Preparar Backend (1-2 semanas)

Seguir [beach-marketplace-backend-guide.md](./beach-marketplace-backend-guide.md):
- Setup NestJS + Prisma + Socket.IO
- Criar models de BD
- Implementar APIs REST
- Implementar WebSocket Gateway

### 2️⃣ Integrar Frontend com API (1 semana)

Criar clients:

```typescript
// apps/web/src/lib/beach-marketplace/beach-api.ts
export const beachAPI = {
  async listBeeaches() {
    return fetch('/api/praia').then(r => r.json());
  },
  
  async createOrder(data) {
    return fetch('/api/pedido', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => r.json());
  },
  
  async getOrder(orderId) {
    return fetch(`/api/pedido/${orderId}`).then(r => r.json());
  },
  
  // ... mais métodos
};
```

Substituir `mock-data.ts` por chamadas à API em `beach-api.ts`.

### 3️⃣ Integrar WebSocket (1 semana)

```typescript
// apps/web/src/hooks/beach-marketplace/use-order-realtime.ts
export function useOrderRealtime(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const socket = useBeachMarketplaceSocket();
  
  useEffect(() => {
    socket.emit('cliente:monitorar-pedido', { orderId });
    
    socket.on('pedido:aceito', (data) => {
      setOrder(data.order);
    });
    
    socket.on('localizacao-ambulante', (data) => {
      // Atualiza mapa com nova posição
    });
    
    return () => {
      socket.off('pedido:aceito');
      socket.off('localizacao-ambulante');
    };
  }, [orderId, socket]);
  
  return order;
}
```

### 4️⃣ Adicionar Mapa (1 semana)

```bash
npm install -w apps/web leaflet react-leaflet
# ou
npm install -w apps/web mapbox-gl
```

```typescript
// apps/web/src/components/beach-marketplace/ambulante-map.tsx
export function AmbullanteMap({ ambulante, clienteLat, clienteLon }) {
  return (
    <MapContainer center={[ambulante.latitude, ambulante.longitude]} zoom={17}>
      <TileLayer url="..." />
      <Marker position={[ambulante.latitude, ambulante.longitude]} />
      <Marker position={[clienteLat, clienteLon]} />
      <Routing from={[clienteLat, clienteLon]} to={[ambulante.latitude, ambulante.longitude]} />
    </MapContainer>
  );
}
```

---

## 📊 Dados Mockados Disponíveis

### Praias
- **Copacabana**: 5 ambulantes
- **Ipanema**: 2 ambulantes  
- **Leblon**: 1 ambulante

### Produtos (7 produtos)
- Sorvetes: Morango, Chocolate, Baunilha
- Picolés: Frutas, Limão
- Bebidas: Água de coco, Suco natural

### Ambulantes (8 no total)
- Nomes e fotos aleatórias
- Ratings variados (4.5-5.0 estrelas)
- Estoque variado (0-55 unidades)

---

## 🧪 Testando Localmente

```bash
# Terminal 1: Backend
cd apps/api
npm run start:dev

# Terminal 2: Frontend
cd apps/web
npm run dev

# Acessar
http://localhost:3001/praia
```

### Cenários de Teste

1. **Teste Feliz**: Ambulante aceita imediatamente
   - Observar animação de aceitação
   - Ver dados do ambulante

2. **Teste de Rejeição**: Ambulante rejeita
   - Observar tentativa com próximo
   - Contar 3 tentativas

3. **Teste de Carrinho**: Adicionar/remover itens
   - Verificar cálculo de total
   - Testar quantidade = 0 (remover item)

4. **Teste Responsivo**: Em mobile
   - Verificar layout em pequenas telas
   - Testar geolocalização (se suportado)

---

## 🐛 Conhecidos Limitações (Fase 1)

- ❌ WebSocket: Usa setTimeout em vez de real-time
- ❌ Localização: Geolocalização do navegador não integrada
- ❌ Mapa: Mostra placeholder de texto
- ❌ Persistência: Dados apenas em memória
- ❌ Autenticação: Nenhuma verificação
- ❌ Pagamento: Não implementado
- ❌ Notificações: Apenas simuladas

Tudo isso será implementado em Fase 2+ com backend real.

---

## 📚 Documentação Relacionada

- [beach-marketplace-plan.md](./beach-marketplace-plan.md) - Arquitetura geral
- [beach-marketplace-backend-guide.md](./beach-marketplace-backend-guide.md) - Guia de implementação backend
- [types.ts](../apps/web/src/lib/beach-marketplace/types.ts) - Tipos compartilhados
- [mock-data.ts](../apps/web/src/lib/beach-marketplace/mock-data.ts) - Dados de teste

---

## 🚀 Checklist para Próximas Fases

### Antes de Iniciar Fase 2

- [ ] MVP Fase 1 testado em produção
- [ ] Feedback do usuário coletado
- [ ] Requisitos finalizados
- [ ] Arquitetura backend aprovada

### Durante Fase 2

- [ ] Backend deployment
- [ ] Testes de carga WebSocket
- [ ] SSL/HTTPS configurado
- [ ] Rate limiting
- [ ] Logging e monitoring

### Antes de Fase 3 (App Mobile)

- [ ] Backend estável em produção
- [ ] APIs documentadas
- [ ] WebSocket testado com múltiplas conexões
- [ ] Autenticação funcionando
- [ ] Payment processing pronto

---

**Status**: ✅ MVP Fase 1 Completo  
**Próximo Passo**: Iniciar desenvolvimento Fase 2 (Backend)  
**Documentação Backend**: Veja [beach-marketplace-backend-guide.md](./beach-marketplace-backend-guide.md)
