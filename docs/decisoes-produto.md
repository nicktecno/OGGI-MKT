# Decisões de produto (consolidado)

Registro único das regras acordadas em conversa; detalhamento nos docs linkados.

| # | Tema | Decisão |
|---|------|---------|
| 1 | **Pagamento e estoque** | O cliente **só paga** se a oferta tiver **estoque disponível** — ou seja, o executor **já liberou** a oferta (`PUBLISHED`) e o marketplace exibe **quantidade > 0** que ela liberou. Sem estoque, sem checkout / pagamento. |
| 2 | **Stripe (captura)** | Com essa regra, o fluxo natural é **cobrança na compra** com **captura no sucesso do pagamento** (`PaymentIntent` confirmado com valor já fechado: produto + frete). *Autorização + captura tardia* é outro padrão (reserva limite do cartão e captura depois); **não** é necessário para “só cobrar com estoque”, pois o estoque já existe antes do pagamento. Ver nota em [domain-model.md](./domain-model.md). |
| 3 | **Sem CEP (proximidade)** | Exibir **“a partir de”** (valor): usar o **menor preço** entre ofertas `PUBLISHED` ativas daquele `CompositeProduct` (e, se desejado, somar frete mínimo estimado na faixa — alinhar UX). |
| 4 | **Empate em proximidade** | Desempate por **menor prazo** (ex.: prazo de entrega estimado até o cliente — produção remanescente + transportadora, ou só SLA de envio conforme modelagem). |
| 5 | **Estoque** | Quem define a quantidade vendável é o **executor**, na **liberação** ao público: só entra no marketplace o que ela **liberou** como disponível. |
| 6 | **Falha / pós-venda** | O **admin** pode **reatribuir** produção/pedido ou **determinar reembolso** (fluxo operacional e Stripe). |
| 7 | **Fornecedores no split** | O **fornecedor** (insumo) vem da **montagem** do produto pelo admin (`linhas_insumo`); o admin **pode editar** a composição quando necessário (impacta custo e split planejado antes da venda). |
| 8 | **Frete a mais** | Valor de frete **cobrado a mais** (acima do embutido na estratégia de preço, se houver comparação) **fica para a plataforma**. **Não pode ocorrer** déficit de frete para a operação: o **preço final pago** no checkout deve **refletir** o frete cotado (Melhor Envio) e o subtotal; atualizar totais na UI antes de confirmar pagamento. |
| 9 | **Melhor Envio** | **Etiqueta automática** após pagamento (worker + API), com webhooks para status. |
| 10 | **Reembolso 7 dias** | Contagem a partir do **recebimento do produto pelo cliente** (registrar `delivered_at` via transportadora / confirmação). |
| 11 | **Papéis** | **Não** há múltiplos papéis na mesma conta: cada usuário tem **um** papel (`SUPPLIER` \| `ADMIN` \| `EXECUTOR` \| `CUSTOMER`). |
| 12 | **Split / frete insumo vs frete ao cliente** | O **frete fornecedor → costureira** (B2B insumos, embutido em `preco_venda_publico` via `frete_insumos_atribuicao_reais`) é custo operacional que a **plataforma** organiza (ex.: Melhor Envio). No **repasse Connect** (quando existir), esse valor **não** deve ir para executor nem fornecedor: fica com a **plataforma** (via `application_fee_amount` / saldo na conta da plataforma), juntamente com a **taxa planejada da plataforma**. O **frete costureira → cliente** cobrado no checkout (linha “Frete (entrega estimada)”) também segue a regra da linha 8 (excedente para a plataforma). **Alternativa** futura: repasse explícito ao fornecedor só do custo de envio se o modelo comercial assim definir; até lá o desenho padrão é plataforma reter o componente de frete B2B para cobrir etiqueta e operação. |
