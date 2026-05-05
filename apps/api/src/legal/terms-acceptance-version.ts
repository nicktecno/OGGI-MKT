/** Versões dos termos por perfil — mantenha alinhado com apps/web/src/lib/account-terms.ts */

export const TERMS_ACCEPTANCE_VERSION = {
  CUSTOMER: 'v1-20260505-cliente',
  SUPPLIER: 'v1-20260505-fornecedor',
  EXECUTOR: 'v1-20260505-executor',
} as const;

export type RegisterRole = keyof typeof TERMS_ACCEPTANCE_VERSION;
