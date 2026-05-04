# Integração: frete na área pública (Melhor Envio)

O frete exibido e contratado no **storefront** (área pública) pode ser implementado com a API do **[Melhor Envio](https://melhorenvio.com.br/)**, agregador de transportadoras comum no e-commerce brasileiro.

## Precisão: dois trechos com Melhor Envio (CEP fornecedor + CEP executor)

O frete **não** precisa ser estimativa fixa no cadastro: pode ser **cotado na API** sempre que fizer sentido (com cache curto e limites de taxa).

| Trecho | Origem → destino | Uso |
|--------|------------------|-----|
| **Insumos** | **CEP do fornecedor** (cadastro do `SupplierProfile`) → **CEP do executor** (oferta / atribuição) | Cotação Melhor Envio por volume/peso declarado do envio de materiais; o valor retornado **entra na composição de custo** (atualiza `frete_ate_executor` ou grava **snapshot** na linha do composto no momento da montagem / recomposição). |
| **Cliente final** | **CEP do executor** (postagem) → **CEP do comprador** (checkout) | Cotação na vitrine/checkout conforme [fluxo sugerido](#fluxo-sugerido-checkout); dimensões/peso do pacote pronto partem do catálogo da oferta. |

Assim o **fornecedor** e o **executor** mantêm CEP válidos; o backend chama a ME com **CEP–CEP reais** + dados do pacote, e a resposta é o valor **preciso** da transportadora naquele momento (sujeito às regras da conta ME e ao sandbox/produção).

## Pagamento do frete do cliente “direto” na Melhor Envio

Além do padrão **produto + frete no mesmo `PaymentIntent` Stripe** (dinheiro entra na conta da loja/plataforma e a API ME **compra** o envio com saldo/token da conta ME integrada), é possível o modelo em que o **cliente paga o frete diretamente na Melhor Envio** (fluxo de compra de envio / carteira ME) para **gerar a etiqueta** com o vínculo correto ao pedido.

- **Implicação técnica**: o checkout precisa **encadear** confirmação do pedido (Stripe do produto) com o passo de **pagamento do frete na ME** (ou link/checkout ME), e o worker de etiquetas só dispara quando **ambos** estiverem confirmados (ou conforme política: etiqueta só após ME paga).
- **Implicação contábil**: o valor do frete **não** passa pelo mesmo extrato Stripe do produto; a plataforma continua cobrando só o que couber no modelo de repasse (produto, taxas, etc.).

Escolher um modelo por ambiente (demo vs produção) e documentar no pedido: `shipping_payment_channel = STRIPE_BUNDLE | ME_DIRECT`.

## Decisões de produto (acordadas)

| Tema | Decisão |
|------|---------|
| **Origem do envio ao cliente** | **Executor** envia do **próprio endereço** — o CEP de origem na cotação Melhor Envio vem do cadastro do executor vinculado ao pedido/produção. |
| **MVP** | **Brasil + BRL**, já prevendo **estoque simples** e/ou **vários CEPs de origem** (por executor ou por depósito futuro). |
| **Vitrine** | **Por executor**: cada item do carrinho / linha de pedido amarra **produto + executor** (`ProductionAssignment` / oferta pública); a cotação usa o **CEP desse executor**. Se houver **várias ofertas** do mesmo produto, o **destaque** na loja segue a oferta **mais próxima** do comprador (CEP) — ver [domain-model.md](./domain-model.md) (*Proximidade ao comprador*). |
| **Estoque** | Só há checkout/pagamento com **`available_quantity > 0`** na oferta (ver [decisoes-produto.md](./decisoes-produto.md)). |
| **Etiqueta** | **Automática** após pagamento confirmado (worker + API Melhor Envio). |
| **Frete a mais** | Valor cobrado **acima** do embutido na estratégia de preço, quando aplicável, **retido pela plataforma**; o **preço final** no checkout deve refletir o **frete cotado** real (sem déficit operacional) — ver [decisoes-produto.md](./decisoes-produto.md) item 8. |

**Implicação**: a cotação de frete ao cliente final usa sempre o executor da **oferta** escolhida (listagem `PUBLISHED`); não há ambiguidade de origem enquanto o checkout referenciar essa linha.

## Por que no backend (NestJS)

- **Token OAuth** e credenciais da conta Melhor Envio **não** devem ir para o bundle do Next.js.
- Cotações e geração de envio devem passar por um **BFF** ou API NestJS com rate limit, cache curto de cotação e validação de CEP/dimensões.

O Next.js chama apenas os endpoints internos (`GET /shipping/quote`, etc.).

## Fluxo sugerido (checkout)

1. **Carrinho** com **ofertas** publicadas (`CompositeProduct` + executor via `ProductionAssignment` em `PUBLISHED`); cada oferta deve ter **dimensões e peso** para cotação (`height`, `width`, `length`, `weight` em cm/kg conforme [documentação](https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos)).
2. Cliente informa **CEP de destino** no checkout.
3. Backend chama a API de **cálculo/cotação** com CEP de **origem** = **endereço do executor** responsável pelo envio + destino + produtos/volumes.
4. Resposta lista opções (PAC, SEDEX, transportadoras integradas, etc.); usar campos alinhados à doc (ex.: `custom_price`, `custom_delivery_time` quando aplicável à sua conta).
5. Cliente **escolhe** uma opção; persistir no pedido antes do pagamento:
   - `shipping_service_id` (ou identificador retornado pela API)
   - `shipping_price_cents`, `shipping_company`, prazo exibido
   - snapshot JSON da cotação (auditoria / disputa)
6. **Pagamento (Stripe)**: incluir o valor do frete no total cobrado ao cliente (PaymentIntent com `amount` = subtotal + frete selecionado − cupons, etc.).
7. **Pós-pagamento**: **compra do frete + geração de etiqueta automática** + postagem, conforme [fluxo completo de integração](https://docs.melhorenvio.com.br/docs/fluxo-completo-de-integracao), com **webhooks** para atualizar status e rastreio no pedido.

## Sandbox

A documentação descreve **ambiente Sandbox** separado da produção (útil para CI e demos). Validar tokens e URLs por ambiente.

## Relação com o modelo de domínio

- O **frete médio** usado na **composição de preço** no painel admin (desconto do “preço final” exibido) é **estratégia de precificação**, independente da cotação real no checkout.
- O **frete pago pelo cliente** na área pública é o resultado da **integração Melhor Envio**. O **total pago** deve usar o **frete cotado** no checkout; eventual **valor a mais** em relação ao embutido no preço de vitrine **fica para a plataforma**, sem permitir **déficit** de frete frente à operação (totais sempre atualizados antes do pagamento).

## Documentação oficial

- [Introdução à API](https://docs.melhorenvio.com.br/reference/introducao-api-melhor-envio)
- [Cotação de fretes](https://docs.melhorenvio.com.br/docs/cotacao-de-fretes)
- [Cálculo de fretes por produtos](https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos)
- [SDK / exemplos](https://docs.melhorenvio.com.br/docs/sdk)

## Próximos passos de implementação

- Persistir no **ExecutorProfile** (ou equivalente) CEP e dimensões padrão de postagem, se necessário; suportar **múltiplos endereços** se o escopo médio incluir mais de um ponto de origem por executor.
- Tabela `shipping_quotes` (opcional) com TTL para não recotar a cada keystroke.
- Webhook Melhor Envio → `POST /webhooks/melhor-envio` no NestJS: validação HMAC, dedupe, atualização de `Order` (`shipped_at`, `delivered_at`, estados `SHIPPED` / `DELIVERED`) — ver [domain-model.md](./domain-model.md) (*Campos de envio e entrega* e *Mapeamento webhooks*).
