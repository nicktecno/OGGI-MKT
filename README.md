# Agregador de serviços

Monorepo do marketplace (Next.js + shadcn + NestJS + PostgreSQL).

## Documentação de negócio e arquitetura

Ver pasta [docs/](docs/) — modelo de domínio, Stripe, Melhor Envio, auth (cookies, sem `localStorage`), infra (Neon, Vercel, Render), throttling. **Guia em linguagem simples** (conceito e passos para utilizadores): [docs/guia-do-usuario.md](docs/guia-do-usuario.md).

## Estrutura

| Pasta | Descrição |
|-------|-----------|
| `apps/web` | Next.js 15 (App Router), Tailwind, **shadcn/ui** — tema editorial (preto, off-white, cinza frio, **vermelho Runway**) inspirado em *O Diabo Veste Prada* (`globals.css`) |
| `apps/api` | NestJS 11, **Throttler**, CORS + cookies, Helmet |
| `docs/` | Especificações |

## Pré-requisitos

- Node.js 20+
- npm 10+ (workspaces na raiz)

## Banco e API local (Docker)

Na raiz do repositório:

```bash
docker compose up -d --build
```

Sobe **Postgres** (porta `5432`) e a **API Nest** em `http://localhost:4000` (migrations na subida). O Next continua no host com `npm run dev:web`.

1. Copie [apps/web/.env.example](apps/web/.env.example) → `apps/web/.env.local` e use **o mesmo** `INTERNAL_API_SECRET` que o compose injeta na API (ou defina `INTERNAL_API_SECRET` num `.env` na raiz — ver [.env.example](.env.example)).
2. Em `apps/web/.env.local`: `COMMERCE_API_URL=http://localhost:4000`.
3. Depois do primeiro `up`, rode o seed no host (aponta para o Postgres local):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agregador" npm run db:seed -w api
```

Sem Docker: só Postgres com `docker compose up -d postgres` e `npm run dev:api` no host com `apps/api/.env`.

Em produção o banco costuma ser **Neon**; a API em **Render** (ou similar) usa `DATABASE_URL` do Neon.

## Variáveis de ambiente (alinhamento Web ↔ API)

| Onde | Variável | Local | Produção |
|------|-----------|-------|----------|
| **Web** (Vercel / `.env.local`) | `COMMERCE_API_URL` | `http://localhost:4000` | `https://…` da API pública |
| **Web** | `INTERNAL_API_SECRET` | igual à API | igual à API (segredo longo) |
| **Web** | `AUTH_SECRET` | ≥32 chars (recomendado) | ≥32 chars, **igual** ao da API |
| **API** (Render / `.env`) | `DATABASE_URL` | Postgres local / Docker | Neon |
| **API** | `INTERNAL_API_SECRET` | igual ao web | igual ao web |
| **API** | `AUTH_SECRET` | igual ao web | igual ao web |
| **API** | `FRONTEND_URL` | `http://localhost:3000` | Origens do Next, vírgula se várias |

Sem `COMMERCE_API_URL` **e** `INTERNAL_API_SECRET`, o front usa modo **demo** (cookies) — login mock e catálogo em memória.

1. Copie `apps/api/.env.example` → `apps/api/.env`
2. Copie `apps/web/.env.example` → `apps/web/.env.local`

## Desenvolvimento

**Opção A — API no Docker, web no host (recomendado para espelhar integração):** `docker compose up -d` na raiz, depois `npm run dev:web`.

**Opção B — tudo no host:** dois terminais:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

- API: <http://localhost:4000> — health: `GET /health`
- Web: <http://localhost:3000>

### Rotas do front (MVP de esqueleto)

| Rota | Área |
|------|------|
| `/` | Home pública (editorial + Unsplash) |
| `/entrar` | Login MVP (cookie HttpOnly `ag_session`) |
| `/loja` | Vitrine pública (cliente após login) |
| `/painel/admin` | Painel admin |
| `/painel/fornecedor` | Painel fornecedor |
| `/painel/executor` | Painel executor |

Código em `apps/web/src/app/(public)/` e `apps/web/src/app/(painel)/` (route groups não aparecem na URL).

**Login MVP (mock):** senha `Demo#2026` para todos — **Ana Runway** `admin@demo.local`, **Bruno Tecidos** `fornecedor@demo.local`, **Carla Mendes** `executor@demo.local`, **Dana Oliveira** `cliente@demo.local`. Redirecionamento por papel: admin / fornecedor / executor → painel correspondente; cliente → `/loja`. Dados de catálogo (2 insumos, 1 produto composto, 1 oferta publicada) estão em `apps/web/src/lib/demo-seed.ts` e aparecem em `/loja` e nos painéis. Defina `AUTH_SECRET` (32+ caracteres) em `apps/web/.env.local` para produção; em dev, um fallback inseguro é usado se estiver vazio.

`FRONTEND_URL` na API deve listar a origem do Next (ex.: `http://localhost:3000`) para CORS com `credentials: true`.

## Deploy (resumo)

- **Web**: Vercel → projeto em `apps/web`; definir `COMMERCE_API_URL`, `INTERNAL_API_SECRET`, `AUTH_SECRET` (iguais à API).
- **API**: Render (Web Service + Docker) → **`Dockerfile` na raiz do repo** (contexto monorepo) ou Root Directory `apps/api` + `Dockerfile` local; `PORT` injetado pela plataforma; `DATABASE_URL` (Neon), `FRONTEND_URL` com URL(s) do Vercel, `INTERNAL_API_SECRET` e `AUTH_SECRET` iguais ao web.
- **DB**: Neon → `DATABASE_URL` na API.

### API que “adormece” (Render free e similares)

O endpoint **`GET /health`** responde rápido, sem autenticação e **fora do rate limit** global — use-o para acordar o serviço.

1. **Monitor externo (recomendado):** em [UptimeRobot](https://uptimerobot.com), [cron-job.org](https://cron-job.org) ou equivalente, crie um HTTP check a cada **10–14 minutos** apontando para `https://<sua-api>/health`.
2. **GitHub Actions:** existe o workflow [`.github/workflows/api-keepalive.yml`](.github/workflows/api-keepalive.yml). No repositório, em **Settings → Secrets and variables → Actions**, crie o secret **`API_HEALTH_URL`** com o valor completo (ex.: `https://sua-api.onrender.com/health`). Sem o secret, o job termina sem erro e não faz pedidos.

Detalhes: [docs/infrastructure.md](docs/infrastructure.md).

## Stripe (sandbox / teste)

1. **Dashboard Stripe** (modo teste): copie a **Secret key** `sk_test_…`.
2. **Web (`apps/web/.env.local`)**: `STRIPE_SECRET_KEY=sk_test_…` e `NEXT_PUBLIC_APP_URL=http://localhost:3000` (ou URL pública do Vercel, sem `/` no fim) para redirecionar o Checkout.
3. **API (`apps/api/.env`)**: a mesma `STRIPE_SECRET_KEY` para Connect + webhook; crie um endpoint de webhook apontando para `https://<sua-api>/webhooks/stripe` e defina `STRIPE_WEBHOOK_SECRET=whsec_…`.
4. **Local com Stripe CLI**: `stripe listen --forward-to localhost:4000/webhooks/stripe` e use o `whsec` exibido em `STRIPE_WEBHOOK_SECRET` na API. Evento tratado: `account.updated` (atualiza onboarding Connect no banco).
5. **Checkout na loja**: com `STRIPE_SECRET_KEY` no Next, cliente (`CUSTOMER`) logado vê **“Pagar com Stripe (teste)”** no `/checkout` — Checkout Session em BRL; sucesso em `/checkout/obrigado?session_id=…` (esvazia o carrinho local). O botão **“Confirmar sem pagamento (demo)”** continua disponível.
6. **Connect** (fornecedor/executor): inalterado na UX; URLs de retorno usam o painel certo (`/painel/fornecedor` ou `/painel/executor`) a partir de `STRIPE_CONNECT_BASE_URL` ou do primeiro `FRONTEND_URL`.
