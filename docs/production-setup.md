# Produção: admin, Stripe live e Melhor Envio

## 1. Remover contas de teste e criar admin oficial

No Neon (produção), **não** use `prisma db seed` — o seed de demo é ignorado quando `NODE_ENV=production`.

Execute **uma vez** na máquina local (ou CI) com a `DATABASE_URL` **direct** do Neon:

```bash
cd apps/api
export DATABASE_URL="postgresql://…"   # URL direct do Neon (sem pooler, para scripts)
export ADMIN_EMAIL="admin@seudominio.com.br"
export ADMIN_PASSWORD='sua-senha-forte'
export CONFIRM_PRODUCTION=yes
npm run bootstrap:production
```

O script:

- Remove todas as contas `*@demo.local`
- Apaga catálogo de demonstração (insumos, peças, ofertas) — desative com `REMOVE_DEMO_CATALOG=false` se precisar manter produtos
- Cria ou atualiza o admin com o e-mail e senha informados

**Nunca** commite a senha no Git. Depois de entrar, altere a senha se a política da equipa exigir.

Defina também na API (Render):

- `PLATFORM_ADMIN_EMAIL` — mesmo e-mail do admin (usado em aprovações de cadastro)

## 2. Stripe (modo produção)

| Onde | Variável | Valor |
|------|----------|--------|
| **API (Render)** | `STRIPE_SECRET_KEY` | `sk_live_…` |
| **API** | `STRIPE_WEBHOOK_SECRET` | `whsec_…` do endpoint **live** |
| **Web (Vercel)** | `STRIPE_SECRET_KEY` | Mesma `sk_live_…` (checkout no Next) |
| **Web** | `NEXT_PUBLIC_APP_URL` | `https://www.seudominio.com.br` (sem `/` no fim) |

No [Dashboard Stripe](https://dashboard.stripe.com) (modo **live**):

1. Ative **Stripe Connect** se fornecedores/executores receberem repasses.
2. Webhook: `https://<sua-api>/webhooks/stripe` — eventos de pagamento e Connect conforme `docs/stripe-connect-validation.md`.
3. Checkout: success/cancel usam `NEXT_PUBLIC_APP_URL` no web.

Com `sk_live_…`, o checkout **não** mostra “Confirmar sem cartão (teste)”.

## 3. Melhor Envio (produção)

| Variável (API Render) | Produção |
|------------------------|----------|
| `MELHOR_ENVIO_API_BASE` | `https://melhorenvio.com.br` |
| `MELHOR_ENVIO_CLIENT_ID` | App na [Área Dev](https://melhorenvio.com.br/painel/gerenciar/tokens) (**produção**) |
| `MELHOR_ENVIO_CLIENT_SECRET` | Segredo do app produção |
| `MELHOR_ENVIO_REDIRECT_URI` | `https://<sua-api>/oauth/melhor-envio/callback` |
| `API_PUBLIC_URL` | `https://<sua-api>` (sem path) |
| `MELHOR_ENVIO_USER_AGENT` | `ModaStore (seu-email@dominio.com.br)` |

Passos:

1. Cadastre no painel ME a **URL de redirecionamento** e o **webhook** `https://<sua-api>/webhooks/melhor-envio`.
2. Com admin logado, abra `https://<sua-api>/integrations/melhor-envio/start` (ou link no painel) e autorize OAuth.
3. Mantenha **saldo na carteira ME** para compra de etiquetas.
4. `FRONTEND_URL` deve incluir o domínio do site (CORS + retorno OAuth).

Sandbox (`https://sandbox.melhorenvio.com.br`) é só para desenvolvimento.

## 4. E-mail transacional (cadastro, pedidos, senha)

Na **API (Render)** configure envio de e-mail. Sem isso, contas são criadas mas **não** chega o e-mail de confirmação de cadastro.

| Variável | Descrição |
|----------|-----------|
| `RESEND_API_KEY` | Chave em [resend.com](https://resend.com) (recomendado) |
| `MAIL_FROM` | Remetente verificado, ex.: `Moda Store <noreply@seudominio.com.br>` |
| `MAIL_SITE_NAME` | Opcional — nome no assunto/corpo (padrão: Moda Store) |

Alternativa: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (e `SMTP_SECURE` se precisar).

Após deploy, faça um cadastro de teste e confira a caixa de entrada (e spam). O assunto é **Cadastro confirmado — …**.

## 5. Checklist rápido

- [ ] `bootstrap:production` executado no Neon de produção
- [ ] Contas `@demo.local` removidas
- [ ] Login com admin oficial OK
- [ ] `sk_live_` na API e no Web
- [ ] `MELHOR_ENVIO_API_BASE=https://melhorenvio.com.br` + OAuth concluído
- [ ] Cotação de frete no checkout responde com valores reais
- [ ] `COMMERCE_API_URL`, `INTERNAL_API_SECRET`, `AUTH_SECRET` iguais entre Vercel e Render
- [ ] `RESEND_API_KEY` + `MAIL_FROM` na API; e-mail de cadastro recebido em teste
