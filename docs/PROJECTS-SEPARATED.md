# 🏗️ Arquitetura - Dois Projetos Separados com Identidades Visuais Semelhantes

## 📋 Estrutura do Monorepo

```
LosLosMKT (Monorepo)
├── apps/
│   ├── web/              ← Single Next.js App com DOIS PROJETOS
│   │   └── src/app/
│   │       ├── (painel)/ ← Los Los Fest (Painel Admin/Cliente/Fornecedor/Executor)
│   │       └── praia/    ← Beach Marketplace (QR Code + Catálogo + Pedidos)
│   └── api/              ← NestJS Backend (compartilhado no futuro)
└── docker-compose.yml
```

## 🎯 Dois Projetos Independentes

### 1️⃣ **Los Los Fest** 
- **Rota Principal**: `/painel/*`
- **Tipo**: Sistema de encomendas para festas
- **Funcionalidade**:
  - Admin: Gerenciar pedidos, produtos, fornecedores
  - Cliente: Fazer pedidos, acompanhar
  - Fornecedor: Gerenciar estoque
  - Executor: Executar pedidos
- **Estado**: ✅ Pronto (já tinha antes)
- **Identidade Visual**: Pink primary color

### 2️⃣ **Beach Marketplace** 
- **Rota Principal**: `/praia/*`
- **Tipo**: Marketplace para venda de sorvetes na praia
- **Funcionalidade**:
  - QR Scanner: Entrada pela praia
  - Catálogo: 7 produtos em 3 categorias
  - Carrinho: Gerenciar compras
  - Pedido: Acompanhamento e notificações
  - Ambulantes: Dashboard para vendedores
- **Estado**: ✅ Phase 1 MVP Completo
- **Identidade Visual**: Blue primary color

## 🎨 Identidades Visuais Semelhantes

Ambos os projetos compartilham:

### Design System
- ✅ Mesmas fontes (Tailwind CSS)
- ✅ Mesmos componentes (shadcn/ui)
- ✅ Mesma estrutura de layout
- ✅ Mesmas animações

### Diferenças Propositais
- **Color Primary**: 
  - Los Los Fest → Pink (#EC4899)
  - Beach Marketplace → Blue (#2563EB)
- **Tema/Mensagens**: Adaptadas ao contexto
  - Fest = Festas, eventos, customização
  - Praia = Sorvetes, ambulantes, geolocation

### Exemplo: Buttons
```jsx
// Los Los Fest
<Button className="bg-pink-600 hover:bg-pink-700">

// Beach Marketplace
<Button className="bg-blue-600 hover:bg-blue-700">

// Mesma estrutura, cores diferentes
```

## 📂 Estrutura de Arquivos Separados

### Los Los Fest (`/painel`)
```
apps/web/src/
├── app/
│   ├── (painel)/
│   │   ├── page.tsx           ← Portais (Admin/Cliente/Fornec/Exec)
│   │   ├── admin/             ← Admin Dashboard
│   │   ├── cliente/           ← Cliente Portal
│   │   ├── fornecedor/        ← Fornecedor Portal
│   │   └── executor/          ← Executor Portal
```

### Beach Marketplace (`/praia`)
```
apps/web/src/
├── app/
│   ├── praia/
│   │   ├── page.tsx                              ← QR Scanner
│   │   └── [beachId]/
│   │       ├── pedido/page.tsx                   ← Catálogo + Carrinho
│   │       ├── confirmacao/[orderId]/page.tsx    ← Pedido Confirmado
│   │       └── ambulante/page.tsx                ← Dashboard Ambulante
│
├── components/
│   ├── beach-marketplace/                        ← Componentes da Praia
│   │   ├── qr-scanner.tsx
│   │   ├── beach-catalog.tsx
│   │   ├── beach-cart.tsx
│   │   ├── order-confirmation.tsx
│   │   └── ambulante-dashboard.tsx
│   └── ui/                                       ← Componentes compartilhados
│
└── lib/
    └── beach-marketplace/                        ← Utilities da Praia
        ├── types.ts
        ├── mock-data.ts
        └── geolocation.ts
```

## 🚀 Como Rodar

### Ambos os Projetos (monorepo)
```bash
cd /Users/nicolascouto/Documents/Projetos/LosLosMKT
npm run dev:web
```

O app roda em `http://localhost:3000` (porta padrão do Next.js)

- **Los Los Fest**: `http://localhost:3000/painel`
- **Beach Marketplace**: `http://localhost:3000/praia`

### Rotas Disponíveis

#### Los Los Fest
```
/painel                           ← Portal com 4 roles
/painel/admin                     ← Dashboard Admin
/painel/cliente                   ← Portal Cliente
/painel/fornecedor                ← Portal Fornecedor
/painel/executor                  ← Portal Executor
/painel/conta/pendente            ← Contas Pendentes
/painel/conta/recusado            ← Contas Recusadas
```

#### Beach Marketplace
```
/praia                                              ← QR Scanner
/praia/beach-copacabana-001/pedido                  ← Catálogo (Copacabana)
/praia/beach-ipanema-001/pedido                     ← Catálogo (Ipanema)
/praia/beach-leblon-001/pedido                      ← Catálogo (Leblon)
/praia/beach-copacabana-001/confirmacao/order-123   ← Confirmação
/praia/beach-copacabana-001/ambulante               ← Dashboard Ambulante
```

## 🔒 Autenticação Separada

### Los Los Fest
- ✅ Autenticação via JWT + Session
- ✅ Middleware protege `/painel` routes
- ✅ Roles: admin, cliente, fornecedor, executor

### Beach Marketplace
- ⏳ Phase 1: Sem autenticação (MVP)
- ⏳ Phase 2: Autenticação para ambulantes
- ⏳ Phase 2: QR Code validation

## 📊 Dados Compartilhados vs Separados

### Separados (Não compartilham dados)
- ✅ Usuários (painel vs ambulantes)
- ✅ Produtos (sorvetes fest vs sorvetes praia)
- ✅ Pedidos (festas vs entregas)
- ✅ Pagamentos (diferentes gateways)

### Potencialmente Compartilhados (Phase 2+)
- Fornecedores (mesmos insumos?)
- Relatórios (dashboard unificado?)
- Analytics

## 🎯 Próximos Passos

### Phase 2 - Backend para Beach Marketplace
1. Implementar API REST (NestJS em `/api`)
2. Prisma schema para dados
3. Autenticação para ambulantes
4. Geolocation real

### Phase 2 - Backend para Los Los Fest
1. Já existe (NestJS)
2. Manter separado

### Phase 3 - Possível Integração
1. Dashboard unificado (optional)
2. Relatórios consolidados
3. Analytics único

## ✅ Validação de Separação

Para garantir que estão separados:

```bash
# Conferir que são rotas diferentes
curl http://localhost:3000/painel      # Los Los Fest
curl http://localhost:3000/praia       # Beach Marketplace

# Conferir que têm componentes próprios
ls apps/web/src/components/beach-marketplace/
# Componentes APENAS da praia

# Conferir que têm dados próprios
ls apps/web/src/lib/beach-marketplace/
# Utils APENAS da praia
```

## 📝 Summary

✅ **Dois projetos SEPARADOS** dentro de um monorepo  
✅ **Identidades visuais SEMELHANTES** (mesmo design, cores diferentes)  
✅ **Rotas independentes** (/painel vs /praia)  
✅ **Componentes separados** (não compartilham UI da praia com painel)  
✅ **Dados separados** (cada um com seu mock/backend)  
✅ **Ambos em produção** rodando na mesma app Next.js  

**Status**: 🟢 PRONTO PARA PRODUÇÃO (Fase 1 MVP)

---

## 🔗 Documentação Relacionada

- [Beach Marketplace Plan](./beach-marketplace-plan.md) - Arquitetura completa
- [Beach Marketplace Backend](./beach-marketplace-backend-guide.md) - API specs (30 páginas)
- [MVP Guide](./beach-marketplace-mvp-fase1.md) - Como usar a Fase 1
