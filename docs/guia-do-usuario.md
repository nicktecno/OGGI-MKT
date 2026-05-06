# Guia para quem usa a plataforma (linguagem simples)

Este texto explica **o que é** o sistema, **para quem** serve e **o que fazer** no site, passo a passo. Não é necessário saber programação.

---

## 1. O que é esta plataforma?

É um **marketplace** (um “sítio de compras” especializado) onde **várias partes** trabalham em conjunto para vender um **serviço/produto** (por exemplo costura, confeção ou um produto composto por insumos).

Em termos simples:

- Há **clientes** que **compram** na loja online.
- Há **fornecedores** que cadastram **insumos** (materiais, tecidos, aviamentos, etc.).
- Há **executores** (por exemplo costureiras) que **produzem** e podem **publicar** o que está disponível para venda.
- Há **administradores** que **montam** o produto final, preços e regras e **gerem** cadastros e aprovações.

Cada pessoa usa **uma conta** com **um papel** (cliente **ou** fornecedor **ou** executor **ou** admin). Não é previsto misturar papéis na mesma conta.

Para o detalhe técnico de negócio, ver [decisoes-produto.md](./decisoes-produto.md) e [domain-model.md](./domain-model.md).

---

## 2. O que precisa para começar?

1. **Endereço do site** (URL), por exemplo `https://www.modastore.com.br` — o dono do projeto passa-te este link.
2. **Navegador atualizado** (Chrome, Firefox, Safari ou Edge).
3. **E-mail** válido para criar conta ou recuperar acesso (quando o registo estiver ligado à base de dados em produção).

Se o projeto ainda estiver em **demonstração** (sem API real), o login pode usar contas de teste descritas na secção 8.

---

## 3. Criar conta ou entrar

### Registar-se (primeira vez)

1. Abre o site.
2. Procura **“Registrar”** ou **“Criar conta”** (o texto pode variar ligeiramente).
3. Preenche **e-mail** e **palavra-passe** (e o que o formulário pedir).
4. Escolhe ou confirma o **tipo de conta** se o site pedir (cliente, fornecedor, executor — conforme o que o projeto permitir no registo).
5. Confirma e, se existir confirmação por e-mail, segue o link que receberes.

### Entrar (já tens conta)

1. Abre **“Entrar”** ou **“Login”**.
2. Introduz **e-mail** e **palavra-passe**.
3. O site pode redirecionar-te automaticamente para a **área certa** (loja ou painel), consoante o teu papel.

Se esqueceres a palavra-passe, usa a opção de **recuperação** se existir no site; caso contrário, contacta o **suporte** do projeto.

---

## 4. Se fores cliente (comprar na loja)

1. Depois de entrar, costumas ir para a **loja** (`/loja`).
2. **Navega** pelos produtos e abre um artigo para ver detalhes.
3. **Adiciona ao carrinho** o que quiseres comprar.
4. Abre o **carrinho** e segue para **checkout** (finalizar compra).
5. Podes ver opção de **pagamento de teste (demo)** ou **pagamento com Stripe em modo teste**, conforme a configuração do site — em teste **não** uses cartão real.
6. Após concluir, podes ser levado a uma página de **“Obrigado”** ou confirmação de pedido.

**Ideia importante:** em produção, a regra de negócio prevista é que **só há pagamento** quando houver **stock disponível** na oferta publicada pelo executor (ver decisões de produto). Na prática do site, segue sempre as mensagens e botões que aparecem no ecrã.

---

## 5. Se fores fornecedor

1. Entra com a conta de **fornecedor**.
2. Vais ao **painel do fornecedor** (`/painel/fornecedor`).
3. Aí podes **gerir o teu perfil** e **cadastrar ou editar insumos** (nome, custos, dados que o formulário pedir).
4. O **administrador** usa estes insumos para **montar** o produto que aparece na loja; o fornecedor **não** define sozinho o preço final ao público — isso integra a lógica acordada no projeto.

---

## 6. Se fores executor (ex.: costureira)

1. Entra com a conta de **executor**.
2. Usa o **painel do executor** (`/painel/executor`).
3. Conforme o que já estiver implementado, podes **atualizar o perfil**, **pedir** para executar um serviço ou **liberar** oferta para a vitrine, alinhado com o fluxo aprovado pelo admin.

O conceito central: o que o cliente vê à venda **por executor** depende de **atribuição de produção** e de **publicação** com quantidade disponível — explicado em detalhe em [domain-model.md](./domain-model.md) para quem quiser aprofundar.

---

## 7. Se fores administrador

1. Entra com a conta de **admin**.
2. Acede ao **painel admin** (`/painel/admin`).
3. Aí podes **ver cadastros**, **aprovar** ou gerir utilizadores e conteúdos conforme as secções disponíveis (clientes, combinações, peças, pedidos, etc., conforme o menu do site).
4. O admin **liga** insumos e regras ao **produto** que aparece na loja e **coordena** o fluxo entre fornecedores e executores.

---

## 8. Modo demonstração (sem “servidor” real)

Quando o site **não** está ligado à API e base de dados de produção (configuração técnica do equipa de desenvolvimento), pode funcionar em **modo demo**:

- Usa dados de exemplo **em memória** (não são guardados como numa loja real).
- O login de teste pode usar a **mesma palavra-passe** para várias contas de exemplo, por exemplo `Demo#2026`, com estes e-mails (exemplo do projeto):

| Personagem de exemplo | E-mail            | O que representa   |
|------------------------|-------------------|--------------------|
| Ana Runway             | `admin@demo.local`     | Administradora     |
| Bruno Tecidos          | `fornecedor@demo.local`| Fornecedor         |
| Maria Aviamentos       | `aviamentos@demo.local`| Fornecedor         |
| Carla Mendes           | `executor@demo.local`  | Executor           |
| Dana Oliveira          | `cliente@demo.local`   | Cliente (loja)     |

Depois de entrar, o site **redireciona** para a área certa (painel ou loja). Isto serve para **treinar** ou **mostrar** o projeto; **não** substitui uma loja em produção com dados reais.

---

## 9. Onde a “plataforma” corre (só para contexto)

Não precisas de configurar isto se fores só utilizador do site:

- O **site** (páginas que vês) costuma estar na **Vercel**.
- A **API** (lógica e base de dados) pode estar no **Render** (ou outro serviço).
- A **base de dados** costuma ser **Neon** (PostgreSQL).

Quem **instala** o projeto é que trata de domínio, e-mails transacionais (ex.: **Resend**), pagamentos (**Stripe**), etc. Guia técnico de infra: [infrastructure.md](./infrastructure.md).

---

## 10. Resumo em uma frase por papel

| Papel        | Resumo |
|-------------|--------|
| **Cliente** | Entra, vê a loja, põe no carrinho e finaliza a compra conforme as opções do site. |
| **Fornecedor** | Entra, gere insumos e dados do perfil no painel do fornecedor. |
| **Executor** | Entra, gere produção e publicação no painel do executor, conforme as regras do admin. |
| **Admin**   | Entra, gere cadastros, produtos e operação no painel admin. |

Se algo no ecrã **não bater** com este guia, o produto pode ter **evoluído** — usa o menu do site como referência principal e, em dúvida, fala com quem **mantém** o projeto.
