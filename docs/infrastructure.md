# Infraestrutura inicial (custo zero / gratuito)

## Banco de dados

- **PostgreSQL** como SGBD principal (relações, transações ACID, JSONB para snapshots, filas leves com `SKIP LOCKED` se necessário).
- **Neon** ([neon.tech](https://neon.tech)): Postgres gerenciado, **tier gratuito** adequado para MVP (branching, suspend compute). Connection string via variável de ambiente no backend.

## Monorepo local

- Raiz com **npm workspaces** (`apps/api`, `apps/web`). Scripts: `npm run dev:api`, `npm run dev:web` na raiz do repositório.
- Um único `package-lock.json` na raiz (evitar lockfile dentro de `apps/web`).

## Hospedagem

| Peça | Serviço | Papel |
|------|---------|--------|
| **Frontend** | **Vercel** ([vercel.com](https://vercel.com)) | Next.js (app router), build e CDN; tier **Hobby** gratuito para projeto pessoal/small. |
| **Backend API** | **Render** ([render.com](https://render.com)) | NestJS via **Web Service** + **Dockerfile** em `apps/api`; tier gratuito com limites de RAM/CPU e **spin-down** após inatividade (cold start aceitável no MVP). |
| **Banco** | **Neon** | Postgres; região próxima à região do serviço Render (ex. Frankfurt / Oregon) para reduzir latência. |

### Render (API): monorepo + Docker

1. **New** → **Web Service** → ligar o repositório GitHub.
2. **Runtime**: Docker. **Root Directory**: vazio (raiz do repo) — existe um `Dockerfile` na raiz que compila `apps/api`. Alternativa: Root Directory `apps/api` e Dockerfile `Dockerfile` (o ficheiro dentro de `apps/api`).
3. Preencher **Environment** com as variáveis da secção abaixo. **`DATABASE_URL` tem de ser a connection string do Neon** (nunca `localhost` — no Render não há Postgres na própria máquina do serviço). No Vercel, `COMMERCE_API_URL` = URL pública `https://….onrender.com` (ou domínio próprio).

#### Neon: pooler vs migrações Prisma

Se `DATABASE_URL` usar o **host com `-pooler-`** (PgBouncer), `prisma migrate deploy` na subida do contentor pode falhar com timeout em **`pg_advisory_lock`**. O schema Prisma define `directUrl` → variável **`DATABASE_DIRECT_URL`**: no dashboard Neon, copie a connection string **direct** (sem pooler / “Connection pooling off”) com o mesmo user, password e database. No Render, defina **as duas** variáveis. Em Postgres local ou se só usar URL directa, pode repetir o mesmo valor nas duas.

## Variáveis de ambiente (visão)

- **Vercel (Next `apps/web`)**: `COMMERCE_API_URL` — URL **HTTPS** pública da API (só servidor Next; chamadas a `/public/*` e rotas internas usam esse base URL). `INTERNAL_API_SECRET` — igual ao valor na API (chamadas server-side com header `x-internal-secret` para `/internal/*`). `AUTH_SECRET` — ≥32 caracteres, **igual** ao `AUTH_SECRET` da API (JWT / alinhamento de auth). Chaves públicas Stripe (`NEXT_PUBLIC_*`) quando existirem.
- **Render / runtime da API (`apps/api`)**: `DATABASE_URL` (Neon, frequentemente **pooled**), **`DATABASE_DIRECT_URL`** (Neon **direct** — obrigatório quando `DATABASE_URL` contém `-pooler-`; ver nota acima), `INTERNAL_API_SECRET`, `AUTH_SECRET`, `FRONTEND_URL` (origens do front, vírgula se várias), `PORT` (Render injeta; o Nest já escuta `process.env.PORT`), `STRIPE_SECRET_KEY`, `MELHOR_ENVIO_*`, `WEBHOOK_SECRET` Stripe, webhooks Melhor Envio em `https://<api>/webhooks/...`.
- **Neon**: sem app rodando na Neon — só credenciais na API.

Build de container da API: contexto do build = pasta `apps/api` (ver `Dockerfile` em `apps/api`). Localmente, `docker compose` na raiz do monorepo sobe Postgres + API com as mesmas variáveis de integração que o front usa em `.env.local`.

## CORS e domínios

- Permitir origem do front Vercel (`*.vercel.app` e domínio customizado) nas rotas REST do Nest.
- Webhooks (Stripe, Melhor Envio) devem usar URL **HTTPS** estável do Render (`*.onrender.com` ou domínio customizado no plano).

## Throttle (rate limiting) nas chamadas

- **NestJS**: `@nestjs/throttler` (ou middleware Redis em escala maior) com **limite global** por IP + limites **mais baixos** em rotas sensíveis: `POST /auth/login`, `POST /auth/refresh`, `POST /webhooks/*` (validação antes de processar), **cotação Melhor Envio**, checkout, criação de `PaymentIntent`.
- **Next.js**: limitar invocações de Route Handlers que batem na API (cache de cotação de CEP curto, debounce no CEP do cliente).
- **Objetivo**: reduzir abuso, brute force em auth e estouro de cota da API Melhor Envio / Stripe. Retornar **429** com `Retry-After` quando aplicável.
- Detalhe de sessão em cookies (sem `localStorage`): [auth.md](./auth.md).

## Limitações do tier gratuito (planejar)

- **Cold start** (Render free: serviço “dorme” após inatividade): primeiro pedido após idle pode demorar.
- **Limites** de build minutes (Vercel), horas de compute (Render), armazenamento/conexões (Neon) — monitorar dashboards.
- **Backups**: Neon free tem retenção limitada; export periódico (`pg_dump`) para S3 ou local em produção futura.

## Próximo passo técnico

- ORM recomendado: **Prisma** ou **Drizzle** com `DATABASE_URL` do Neon; migrations na pipeline (GitHub Actions ou local antes do deploy).
- Registrar globalmente **`ThrottlerModule`** no Nest e overrides por controller (`@Throttle()`).

## Referência cruzada

- Modelo de domínio e webhooks: [domain-model.md](./domain-model.md)
- Decisões de produto: [decisoes-produto.md](./decisoes-produto.md)
- Auth, cookies e sem `localStorage`: [auth.md](./auth.md)
