# 📊 Diagrama de Arquitetura - Projetos Separados

## Fluxo de Usuários

```mermaid
graph TD
    A["localhost:3000"] --> B["Qual projeto?"]
    
    B -->|/painel| C["🎉 Los Los Fest"]
    B -->|/praia| D["🏖️ Beach Marketplace"]
    
    C --> C1["Portal (Admin/Cliente/Fornec/Exec)"]
    C1 --> C2["Admin Dashboard"]
    C1 --> C3["Cliente Portal"]
    C1 --> C4["Fornecedor Portal"]
    C1 --> C5["Executor Portal"]
    
    D --> D1["QR Scanner"]
    D1 --> D2["Selecionar Praia"]
    D2 --> D3["Catálogo de Produtos"]
    D3 --> D4["Carrinho & Checkout"]
    D4 --> D5["Confirmação de Pedido"]
```

## Estrutura de Pastas

```
apps/web/src/
├── app/
│   ├── (painel)/                          ← LOS LOS FEST
│   │   ├── page.tsx
│   │   ├── admin/
│   │   ├── cliente/
│   │   ├── fornecedor/
│   │   └── executor/
│   │
│   └── praia/                             ← BEACH MARKETPLACE
│       ├── page.tsx
│       └── [beachId]/
│           ├── pedido/
│           ├── confirmacao/[orderId]/
│           └── ambulante/
│
├── components/
│   ├── beach-marketplace/                 ← PRAIA ONLY
│   │   ├── qr-scanner.tsx
│   │   ├── beach-catalog.tsx
│   │   ├── beach-cart.tsx
│   │   ├── order-confirmation.tsx
│   │   └── ambulante-dashboard.tsx
│   │
│   └── ui/                                ← SHARED
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
└── lib/
    └── beach-marketplace/                 ← PRAIA ONLY
        ├── types.ts
        ├── mock-data.ts
        └── geolocation.ts
```

## Design System Semelhante

```mermaid
graph LR
    A["Design System"]
    A --> B["Tailwind CSS<br/>shadcn/ui<br/>Tipografia"]
    
    B --> C["Los Los Fest<br/>Pink (#EC4899)"]
    B --> D["Beach Marketplace<br/>Blue (#2563EB)"]
    
    C --> C1["Admin: Dark Pink"]
    C --> C2["Cliente: Amber"]
    C --> C3["Fornecedor: Green"]
    C --> C4["Executor: Purple"]
    
    D --> D1["Primary: Blue"]
    D --> D2["Secondary: Sky"]
```

## Componentes Compartilhados vs Separados

```mermaid
graph TD
    SHARED["🔵 Componentes Compartilhados<br/>ui/button.tsx<br/>ui/card.tsx<br/>ui/input.tsx"]
    
    FEST["🎉 Los Los Fest<br/>Usa componentes UI"]
    BEACH["🏖️ Beach Marketplace<br/>Usa componentes UI<br/>+ Componentes próprios"]
    
    FEST_SPECIFIC["🎉 Específicos Fest<br/>Admin panels<br/>Role selectors"]
    BEACH_SPECIFIC["🏖️ Específicos Praia<br/>QR Scanner<br/>Beach Catalog<br/>Order Confirmation"]
    
    SHARED --> FEST
    SHARED --> BEACH
    
    FEST --> FEST_SPECIFIC
    BEACH --> BEACH_SPECIFIC
```

## Dados: Separados

```mermaid
graph LR
    A["🗄️ Dados"]
    
    A --> B["Los Los Fest"]
    A --> C["Beach Marketplace"]
    
    B --> B1["Produtos Fest"]
    B --> B2["Pedidos Fest"]
    B --> B3["Usuários Painel"]
    B --> B4["Fornecedores"]
    
    C --> C1["Praias: Copacabana,<br/>Ipanema, Leblon"]
    C --> C2["Ambulantes"]
    C --> C3["Produtos Praia"]
    C --> C4["Pedidos Praia"]
    
    style B fill:#ffc0d9
    style C fill:#bfdbfe
```

## Fluxo: Los Los Fest (Admin)

```mermaid
graph TD
    A["Acessa /painel"] --> B["Middleware verifica<br/>autenticação"]
    B -->|Logado| C["Portal de Roles"]
    B -->|Não logado| D["Redireciona para login"]
    
    C --> E["Escolhe Role"]
    E --> E1["Admin → /painel/admin"]
    E --> E2["Cliente → /painel/cliente"]
    E --> E3["Fornecedor → /painel/fornecedor"]
    E --> E4["Executor → /painel/executor"]
    
    style A fill:#ffc0d9
    style E fill:#ffc0d9
    style E1 fill:#ffc0d9
    style E2 fill:#ffc0d9
    style E3 fill:#ffc0d9
    style E4 fill:#ffc0d9
```

## Fluxo: Beach Marketplace (MVP)

```mermaid
graph TD
    A["Acessa /praia"] --> B["QR Scanner<br/>ou Seleciona Praia"]
    B --> C["Vai para<br/>/praia/[beachId]/pedido"]
    C --> D["Vê Catálogo<br/>7 produtos × 3 categorias"]
    D --> E["Adiciona ao Carrinho"]
    E --> F["Checkout"]
    F --> G["Vai para<br/>/praia/[beachId]/confirmacao/[orderId]"]
    G --> H["Acompanha Pedido<br/>Aguarda Ambulante"]
    
    style A fill:#bfdbfe
    style B fill:#bfdbfe
    style C fill:#bfdbfe
    style D fill:#bfdbfe
    style E fill:#bfdbfe
    style F fill:#bfdbfe
    style G fill:#bfdbfe
    style H fill:#bfdbfe
```

## Stack Tecnológico

```mermaid
graph TD
    A["Next.js 15.5.15<br/>React 19 + TypeScript"]
    
    A --> B["Frontend"]
    A --> C["Backend"]
    
    B --> B1["Tailwind CSS"]
    B --> B2["shadcn/ui"]
    B1 --> B3["Los Los Fest<br/>components"]
    B1 --> B4["Beach Marketplace<br/>components"]
    B2 --> B3
    B2 --> B4
    
    C --> C1["NestJS (apps/api)"]
    C1 --> C2["Prisma ORM"]
    C2 --> C3["PostgreSQL"]
    
    style A fill:#f3f4f6
    style B3 fill:#ffc0d9
    style B4 fill:#bfdbfe
    style C1 fill:#f3f4f6
```

## Deployment

```mermaid
graph LR
    A["Ambiente"]
    
    A --> B["Desenvolvimento"]
    A --> C["Produção"]
    
    B --> B1["localhost:3000/painel"]
    B --> B2["localhost:3000/praia"]
    
    C --> C1["Opção 1: Monolito<br/>www.loslos.com/painel<br/>www.loslos.com/praia"]
    C --> C2["Opção 2: Separado<br/>admin.loslos.com<br/>praia.loslos.com"]
    
    style B1 fill:#ffc0d9
    style B2 fill:#bfdbfe
    style C1 fill:#f3f4f6
    style C2 fill:#f3f4f6
```

---

**Conclusão**: Dois projetos completamente separados, com identidades visuais semelhantes, rodando na mesma app Next.js por enquanto. Podem ser extraídos para repos/deployments separados quando necessário.
