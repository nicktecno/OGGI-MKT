# Autenticação: OAuth + sessão na plataforma (refresh token)

## Objetivo

- **Login via OAuth** (ex.: Google, Apple, GitHub — lista configurável) para reduzir fricção e senhas gerenciadas por terceiros confiáveis.
- **Sessão dentro da plataforma**: após o OAuth, o **backend (NestJS)** emite credenciais **próprias** para chamadas à API: **access token** de curta duração + **refresh token** de longa duração, com **rotação** do refresh em uso sensível.

### Credenciais: **cookies**, não `localStorage`

- **Não** usar `localStorage` nem `sessionStorage` para **access token**, **refresh token**, **session id** ou qualquer segredo de sessão — qualquer script na página (XSS) leria esses valores.
- **Usar cookies** com: **`HttpOnly`**, **`Secure`** (HTTPS), **`SameSite`** adequado (`Lax` ou `Strict` conforme fluxo OAuth cross-site e domínio da API vs front).
- Padrão recomendado: **refresh** só em cookie HttpOnly; **access** pode ser cookie HttpOnly de curta duração **ou** só emitido em respostas server-side (BFF) sem JavaScript no cliente ler o valor.
- Domínio: alinhar cookie entre **Vercel** e **Koyeb** (subdomínio compartilhado `.seudominio.com` ou proxy `/api` no Next) para o browser enviar o cookie automaticamente; se API for origem diferente sem cookie compartilhado, usar **Route Handler** no Next como proxy autenticado.

## Fluxo resumido

1. Usuário clica em “Entrar com Google” no Next.js.
2. Redirect OAuth → callback no Next **ou** no Nest (um único lugar deve receber o `code` e trocar por tokens do IdP).
3. Backend valida o perfil OAuth, **cria ou vincula** `User` (e-mail verificado pelo IdP), gera **access JWT** e **refresh** opaco (hash no DB).
4. Resposta do login / refresh define cookies (`Set-Cookie`); **não** devolver refresh no JSON para o cliente armazenar.
5. `POST /auth/refresh` lê refresh **do cookie**, rotaciona tokens, devolve novos `Set-Cookie`; **throttle** agressivo nesta rota (ver [infrastructure.md](./infrastructure.md)).

## NestJS

- Módulo `auth`: estratégia OAuth (Passport ou `@nestjs/passport` + `passport-google-oauth20` etc.), serviço de emissão JWT (`@nestjs/jwt`), tabela `refresh_tokens` (`user_id`, `token_hash`, `expires_at`, `revoked_at`, `replaced_by_id` opcional).
- **Guards** em rotas: JWT access (lido de cookie ou header **só** se injetado server-side); refresh em rota dedicada com **throttle** estrito.
- **Revogação**: logout grava `revoked_at`; troca de senha / suspeita pode revogar todas as sessões do usuário.

## Next.js

- Route Handlers ou Server Actions para callback OAuth se o fluxo passar pelo app.
- Chamadas à API: **Server Components / Route Handlers / Server Actions** que encaminham o cookie de sessão ao Nest; evitar fetch do browser com `Authorization` preenchido a partir de variável JS.

## Segurança mínima

- Refresh: alta entropia, só hash no banco; TTL e reuse detection (se refresh já usado, revogar cadeia).
- CORS e `SameSite` coerentes com domínio da API e do front.
- Papéis (`SUPPLIER`, `ADMIN`, `EXECUTOR`, `CUSTOMER`) no claim ou carregados por `sub` a cada request. **Regra de produto**: **um papel por usuário** — não emitir tokens com múltiplos papéis na mesma conta (ver [decisoes-produto.md](./decisoes-produto.md)).

## Referências

- [OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749) (refresh grant)
- [NestJS JWT](https://docs.nestjs.com/security/authentication)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
