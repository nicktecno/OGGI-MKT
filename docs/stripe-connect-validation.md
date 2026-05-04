# Validação Stripe Connect: país, contas, disputas vs split D+15

Este documento implementa o item **validate-stripe** do plano: decisões de integração, risco e alinhamento da regra de negócio “repasse após 15 dias” com o comportamento real do Stripe.

## Premissas de produto

- Cobrança ao **cliente final** (B2C).
- Repasse para **fornecedor**, **executor (costureira)** e retenção **admin/plataforma**.
- Split **não** no momento da captura, e sim **após N dias** da compra (ex.: 15).
- **Reembolso comercial**: janela de **7 dias** a partir do **recebimento** pelo cliente, para produto **artesanal**, sem prejuízo do CDC — ver [domain-model.md](./domain-model.md) e [decisoes-produto.md](./decisoes-produto.md). O agendamento do split deve respeitar estornos nesse período.

## Stripe Connect no Brasil

1. **Disponibilidade de produto**: Stripe suporta contas no Brasil e integração Connect; capacidades exatas (`transfers`, `card_payments`, etc.) dependem do tipo de conta conectada e do onboarding. Validar em [Stripe global availability](https://docs.stripe.com/connect/global) e no Dashboard (modo teste) para os países dos **pagadores** e dos **recebedores**.
2. **Moeda**: definir se a loja cobra em **BRL** apenas ou aceita internacional; isso afeta taxas FX e restrições de transferência cross-border.
3. **KYC**: fornecedores e executores como **connected accounts** passam pelo fluxo de verificação da Stripe (documentos, titularidade). Sem contas ativas e com capability `transfers` (ou equivalente ao modelo escolhido), não há payout confiável.

## Modelo de charge recomendado para o seu caso

Para marketplaces que **centralizam a cobrança** e depois **distribuem** valores a vários destinatários, o padrão documentado é **Separate charges and transfers** (cobrança na conta da **plataforma** + `Transfer` para contas conectadas).

Referência: [Separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers).

### Merchant of record (MoR)

Com separate charges and transfers, a **plataforma** costuma ser o **merchant of record** em relação ao cliente: taxas da Stripe na plataforma, reembolsos e política de serviço precisam estar claras nos termos.

### Disputas e chargebacks (impacto direto no D+15)

Documentação oficial — **Destination charges e separate charges and transfers**:

> Stripe debits dispute amounts and fees from **your platform account**.

Fonte: [Disputes on Connect platforms](https://docs.stripe.com/connect/disputes).

Implicações:

- Atrasar repasse (15 dias) **reduz risco operacional** (não pagar fornecedor/executor antes de saber se o pagamento “segurou”), mas **não elimina** disputas que podem surgir **depois** da janela típica de cartão (muitas redes permitem chargeback além de 15 dias, conforme rede e tipo de transação).
- A plataforma deve prever: **saldo na conta Stripe**, possibilidade de **transfer reversal** se já tiver transferido e surgir disputa, e processo jurídico/comercial para estornos após repasse.

**Recomendação**: tratar “15 dias” como **regra mínima de negócio** alinhada a política de devolução da loja + análise jurídica; opcionalmente usar **prazo maior** ou **repasse parcial** se o risco de chargeback for alto no vertical de moda.

## Standard vs Express vs Custom

| Tipo | Quando considerar |
|------|-------------------|
| **Standard** | Conta conectada “dona” do próprio Stripe Dashboard; menos controle da plataforma sobre UX de onboarding. |
| **Express** | Onboarding rápido, Stripe hospeda parte do fluxo; bom para muitos fornecedores/executores com menos engenharia. |
| **Custom** | Máximo controle da UX e do produto; mais compliance e responsabilidade de implementação (frequentemente com assessoria). |

Para MVP com equipe pequena, **Express** (ou Standard se os parceiros aceitarem gerir o Stripe) costuma ser o melhor equilíbrio. **Custom** só se a experiência white-label for requisito forte.

## Payout D+15 vs “funds available”

- A Stripe libera valores para payout conforme **calendário de disponibilidade** do saldo (país, risco, método de pagamento). O repasse aos connected accounts via **Transfer** só deve ser programado quando o saldo da plataforma **tiver fundos disponíveis** para não falhar a transferência.
- Implementação típica: na confirmação do pagamento (`checkout.session.completed` ou `payment_intent.succeeded`), persistir `payout_eligible_at = purchased_at + 15 days`. Um **worker** (ver `payout-job-spec.md`) cria as `Transfer` idempotentes nessa data ou após ela, se o saldo permitir.

## Checklist antes de codar

- [ ] Confirmar país da **plataforma** e países dos **connected accounts** na documentação atual da Stripe.
- [ ] Definir MoR, política de reembolso e quem assume disputa na relação com cliente e com fornecedor/executor.
- [ ] Definir se D+15 é **calendário** ou **dias úteis** e como interage com feriados e falhas de transferência.
- [ ] Testar em **modo teste**: charge → espera simulada ou data fake → múltiplas `Transfer` + webhooks `transfer.*`.

## Referências

- [How Connect works](https://docs.stripe.com/connect/overview)
- [Separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
- [Disputes on Connect platforms](https://docs.stripe.com/connect/disputes)
- [Transfer reversals](https://docs.stripe.com/api/transfer_reversals/create)
