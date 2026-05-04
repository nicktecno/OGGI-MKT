# Job de repasse pós-compra: transferências multi-destino e idempotência

Este documento implementa o item **payout-job** do plano: especificação para o NestJS (ou worker separado) que executa o split após N dias (ex.: 15) da compra.

## Objetivo

Após `payment_intent.succeeded` (ou equivalente), **não** transferir imediatamente (se essa for a regra de negócio). Persistir intenção de repasse e, quando `now >= order.payout_eligible_at`, criar **uma ou mais** `Transfer` na Stripe (Connect — separate charges and transfers) para:

- conta conectada do **fornecedor** (ou múltiplos fornecedores se o pedido desmembrar por insumo);
- conta conectada do **executor**;
- retenção na **plataforma** (nada a transferir — valor já fica no saldo da plataforma após deduções).

**Nota**: se “admin” for apenas usuário interno sem connected account, a parcela da plataforma permanece no saldo da conta Stripe da aplicação; só se houver entidade jurídica separada com connected account faria sentido transferir para ela.

## Gatilhos

1. **Primário**: job agendado (cron / BullMQ repeatable / `@nestjs/schedule`) a cada **1h** ou **15min**, processando pedidos em lote:
   - `order.status = PAID`
   - `order.payout_status = PENDING`
   - `order.payout_eligible_at <= now`
2. **Secundário**: endpoint interno “reprocessar payouts falhos” (admin) com autenticação forte.

## Entrada de dados (snapshot)

Na transição para `PAID`, persistir em `order_payout_plan` (tabela ou JSON imutável):

| Campo | Descrição |
|-------|-----------|
| `supplier_transfer_amount` | Em menor unidade da moeda (centavos). |
| `executor_transfer_amount` | Idem. |
| `platform_retained_amount` | Idem (informativo; pode ser derivado). |
| `currency` | `brl`, etc. |
| `supplier_stripe_account_id` | `acct_xxx` |
| `executor_stripe_account_id` | `acct_xxx` |
| `source_charge_id` ou `payment_intent_id` | Para auditoria e suporte. |

**Regra**: o job **só lê** o snapshot; nunca recalcula a partir de preços atuais do catálogo.

## Fluxo do worker (pseudo-algoritmo)

```
para cada order elegível (limite batch, ex.: 100):
  adquirir lock distribuído (ex.: Redis SET payout:order:{id} NX EX 300)
  se não adquiriu: skip
  se order.payout_status != PENDING: skip
  iniciar transação DB:
    marcar order.payout_status = IN_PROGRESS (opcional) ou manter PENDING até sucesso
  fora da transação (chamadas Stripe):
    criar Transfer 1 -> fornecedor com idempotency_key
    criar Transfer 2 -> executor com idempotency_key
  se todas as Transfer retornarem sucesso:
    DB: payout_status = COMPLETED, payout_completed_at = now, guardar ids das transfers
  se falha retentável (rede, 429):
    DB: payout_last_error, manter PENDING, backoff
  se falha definitiva (conta conectada inválida):
    DB: payout_status = FAILED_MANUAL, alertar ops
  liberar lock
```

## Idempotência

### Chaves Stripe

Para cada chamada mutável (`Transfer.create`), enviar header:

`Idempotency-Key: payout-{orderId}-supplier-v1`

`Idempotency-Key: payout-{orderId}-executor-v1`

Se o worker retentar após timeout, a Stripe **não duplica** a transferência com a mesma chave.

### Banco de dados

- Tabela `payout_ledger` com `UNIQUE(order_id, leg)` onde `leg ∈ { SUPPLIER, EXECUTOR }`.
- Antes de chamar Stripe, `INSERT ... ON CONFLICT DO NOTHING`; se conflito e linha já tem `stripe_transfer_id`, tratar como sucesso idempotente.

## Concorrência

- **Um** processador ativo por `order_id` (lock) evita dupla transferência em deploy com múltiplas réplicas.
- Jobs em shard por `order_id % N` reduzem contenção se volume crescer.

## Webhooks (reconciliação)

Ouvir pelo menos:

- `transfer.created` / `transfer.updated` (ou falhas)
- `charge.dispute.created` — pode exigir **pausar** payouts pendentes ou acionar `transfer_reversals` em repasses já feitos (ver `docs/stripe-connect-validation.md`).

Persistir eventos brutos em `stripe_events` (dedupe por `event.id`) antes de aplicar efeitos colaterais.

## Falhas e operações

| Cenário | Ação |
|---------|------|
| Saldo insuficiente na plataforma | `PENDING`, log, alerta; retentar no próximo ciclo. |
| Connected account sem capability | `FAILED_MANUAL`; UI admin para corrigir onboarding. |
| Pedido reembolsado antes do payout | Cancelar elegibilidade: `payout_status = CANCELLED`. |
| Valor zero para um leg | Não chamar `Transfer` para esse leg; marcar leg como `SKIPPED`. |

## Testes (modo Stripe test)

- Cartões de teste com PI que succeed.
- Simular clock avançando `payout_eligible_at` via script ou atualização em DB em ambiente de dev.
- Forçar retry com mesma idempotency key e assert uma única transfer no Dashboard.

## Referências

- [Create a transfer](https://docs.stripe.com/api/transfers/create)
- [Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Transfer reversals](https://docs.stripe.com/api/transfer_reversals/create)
- [Separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
