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
| **Backend API** | **Koyeb** ([koyeb.com](https://www.koyeb.com)) | NestJS em **container** ou build nativo; tier gratuito com limites de vCPU/RAM e scale-to-zero (cold start aceitável no MVP). |
| **Banco** | **Neon** | Postgres; região próxima ao runtime Koyeb (ex. `aws-eu-central-1` / `us-east-1`) para reduzir latência. |

## Variáveis de ambiente (visão)

- **Vercel (Next `apps/web`)**: `COMMERCE_API_URL` — URL **HTTPS** pública da API (só servidor Next; chamadas a `/public/*` e rotas internas usam esse base URL). `INTERNAL_API_SECRET` — igual ao valor na API (chamadas server-side com header `x-internal-secret` para `/internal/*`). `AUTH_SECRET` — ≥32 caracteres, **igual** ao `AUTH_SECRET` da API (JWT / alinhamento de auth). Chaves públicas Stripe (`NEXT_PUBLIC_*`) quando existirem.
- **Koyeb / runtime da API (`apps/api`)**: `DATABASE_URL` (Neon), `INTERNAL_API_SECRET`, `AUTH_SECRET`, `FRONTEND_URL` (origens do front, vírgula se várias), `PORT`, `STRIPE_SECRET_KEY`, `MELHOR_ENVIO_*`, `WEBHOOK_SECRET` Stripe, webhooks Melhor Envio em `https://<api>/webhooks/...`.
- **Neon**: sem app rodando na Neon — só credenciais na API.

Build de container da API: contexto do build = pasta `apps/api` (ver `Dockerfile` em `apps/api`). Localmente, `docker compose` na raiz do monorepo sobe Postgres + API com as mesmas variáveis de integração que o front usa em `.env.local`.

## CORS e domínios

- Permitir origem do front Vercel (`*.vercel.app` e domínio customizado) nas rotas REST do Nest.
- Webhooks (Stripe, Melhor Envio) devem usar URL **HTTPS** estável do Koyeb (custom domain opcional no free tier conforme plano).

## Throttle (rate limiting) nas chamadas

- **NestJS**: `@nestjs/throttler` (ou middleware Redis em escala maior) com **limite global** por IP + limites **mais baixos** em rotas sensíveis: `POST /auth/login`, `POST /auth/refresh`, `POST /webhooks/*` (validação antes de processar), **cotação Melhor Envio**, checkout, criação de `PaymentIntent`.
- **Next.js**: limitar invocações de Route Handlers que batem na API (cache de cotação de CEP curto, debounce no CEP do cliente).
- **Objetivo**: reduzir abuso, brute force em auth e estouro de cota da API Melhor Envio / Stripe. Retornar **429** com `Retry-After` quando aplicável.
- Detalhe de sessão em cookies (sem `localStorage`): [auth.md](./auth.md).

## Limitações do tier gratuito (planejar)

- **Cold start** (Koyeb scale-to-zero): primeiro request após idle pode demorar.
- **Limites** de build minutes (Vercel), horas de compute (Koyeb), armazenamento/conexões (Neon) — monitorar dashboards.
- **Backups**: Neon free tem retenção limitada; export periódico (`pg_dump`) para S3 ou local em produção futura.

## Próximo passo técnico

- ORM recomendado: **Prisma** ou **Drizzle** com `DATABASE_URL` do Neon; migrations na pipeline (GitHub Actions ou local antes do deploy).
- Registrar globalmente **`ThrottlerModule`** no Nest e overrides por controller (`@Throttle()`).

## Referência cruzada

- Modelo de domínio e webhooks: [domain-model.md](./domain-model.md)
- Decisões de produto: [decisoes-produto.md](./decisoes-produto.md)
- Auth, cookies e sem `localStorage`: [auth.md](./auth.md)
