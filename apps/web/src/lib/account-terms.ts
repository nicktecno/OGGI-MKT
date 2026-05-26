/**
 * Textos de termos por tipo de conta. A versão deve coincidir com
 * apps/api/src/legal/terms-acceptance-version.ts
 */

import { SITE_NAME } from "./site";

export const ACCOUNT_TERMS_VERSION = {
  CUSTOMER: "v1-20260505-cliente",
  SUPPLIER: "v1-20260505-fornecedor",
  EXECUTOR: "v1-20260505-executor",
} as const;

export type AccountTermsRole = keyof typeof ACCOUNT_TERMS_VERSION;

export type AccountTermsBlock = {
  title: string;
  version: string;
  intro: string;
  sections: { heading: string; body: string }[];
};

const customerTerms: AccountTermsBlock = {
  title: "Termos de uso — Cliente",
  version: ACCOUNT_TERMS_VERSION.CUSTOMER,
  intro: `Ao criar uma conta de cliente na plataforma, você declara ter lido e compreendido as condições abaixo, que regem o uso da loja, pedidos e relacionamento com a ${SITE_NAME} e parceiros.`,
  sections: [
    {
      heading: "1. Natureza do serviço",
      body:
        "A conta de cliente permite navegar, montar pedidos de produtos oferecidos na loja e acompanhar o status das compras. Preços, prazos e disponibilidade seguem as regras exibidas no site e podem ser atualizados pela equipe.",
    },
    {
      heading: "2. Cadastro e dados",
      body:
        "Você se compromete a fornecer informações verdadeiras e manter seus dados de contato atualizados. O uso da conta é pessoal e intransferível; você é responsável pela confidencialidade da senha.",
    },
    {
      heading: "3. Pagamentos e entregas",
      body:
        "Pagamentos são processados por meios indicados ao finalizar a compra (incluindo processadores como o Stripe, quando aplicável). Prazos e condições de entrega seguem o que for informado no pedido e às políticas da transportadora ou parceiro logístico.",
    },
    {
      heading: "4. Limitação de responsabilidade",
      body:
        "A plataforma atua como intermediária entre você, executores (costureiras) e fornecedores conforme o modelo de negócio. Dúvidas sobre execução da peça ou insumos devem ser tratadas nos canais indicados após a compra, sem prejuízo dos seus direitos do consumidor.",
    },
    {
      heading: "5. Alterações",
      body:
        "Estes termos podem ser atualizados. Versões futuras poderão exigir novo aceite em login ou ao finalizar a compra; a versão vigente no momento do cadastro fica registrada em seu perfil.",
    },
  ],
};

const supplierTerms: AccountTermsBlock = {
  title: "Termos de uso — Fornecedor",
  version: ACCOUNT_TERMS_VERSION.SUPPLIER,
  intro:
    "Ao solicitar cadastro como fornecedor de insumos, você aceita as obrigações abaixo em relação à plataforma, aos executores e aos pedidos vinculados aos seus produtos.",
  sections: [
    {
      heading: "1. Papel do fornecedor",
      body:
        "Você cadastra insumos (descrição, imagens, quantidades, dimensões de embalagem quando aplicável) e se compromete a cumprir entregas conforme pedidos atribuídos após aprovação do administrador e montagem do produto composto.",
    },
    {
      heading: "2. Aprovação e conduta",
      body:
        "O cadastro passa por análise da equipe. A plataforma pode recusar, suspender ou encerrar parcerias em caso de descumprimento, fraude, informações falsas ou violação de políticas comerciais ou legais.",
    },
    {
      heading: "3. Frete e logística",
      body:
        "Cotações e envios podem utilizar integrações logísticas (ex.: Melhor Envio). Você é responsável pela veracidade das dimensões e peso informados e por embalar corretamente; valores de frete recalculados após ajustes passam a valer para o fluxo indicado no painel.",
    },
    {
      heading: "4. Pagamentos e repasses",
      body:
        "Valores devidos ao fornecedor seguem o acordo comercial com a plataforma e o uso de contas de pagamento (ex.: Stripe Connect), quando habilitado. Taxas, prazos de liquidação e comissões serão exibidas ou comunicadas nos canais oficiais.",
    },
    {
      heading: "5. Propriedade intelectual e imagens",
      body:
        "Você declara possuir direito de uso das imagens e textos enviados. Conteúdo ilícito ou que viole direitos de terceiros não é permitido.",
    },
    {
      heading: "6. Alterações",
      body:
        "Os termos podem ser atualizados; nova versão pode exigir novo aceite para continuar operando como fornecedor. A versão aceita no cadastro fica registrada.",
    },
  ],
};

const executorTerms: AccountTermsBlock = {
  title: "Termos de uso — Costureira (executor)",
  version: ACCOUNT_TERMS_VERSION.EXECUTOR,
  intro:
    "Ao solicitar cadastro como costureira (executor), você aceita as condições abaixo sobre produção, uso do painel e relacionamento com a plataforma, fornecedores e clientes finais.",
  sections: [
    {
      heading: "1. Papel da costureira",
      body:
        "Você poderá receber atribuições de produção conforme produtos e políticas definidas pelo administrador. Compromete-se a executar o trabalho com qualidade, respeitando prazos e especificações comunicadas no painel ou pelos canais oficiais.",
    },
    {
      heading: "2. Endereço e recebimento",
      body:
        "O endereço informado no cadastro pode ser usado para envio de insumos por fornecedores e logística integrada. Mantenha os dados corretos; alterações relevantes devem ser atualizadas prontamente.",
    },
    {
      heading: "3. Aprovação e conduta",
      body:
        "O cadastro passa por análise. A plataforma pode recusar, suspender ou encerrar o acesso em caso de inadimplemento grave, fraude ou violação de políticas.",
    },
    {
      heading: "4. Pagamentos e repasses",
      body:
        "Remuneração e repasses seguem o modelo acordado com a plataforma e ferramentas de pagamento (ex.: Stripe Connect), quando aplicável. Comissões da plataforma e valores líquidos serão tratados conforme regras vigentes.",
    },
    {
      heading: "5. Alterações",
      body:
        "Estes termos podem ser revisados. Poderá ser solicitado novo aceite para manter o acesso ao painel de executor. A versão aceita no cadastro fica registrada.",
    },
  ],
};

const BY_ROLE: Record<AccountTermsRole, AccountTermsBlock> = {
  CUSTOMER: customerTerms,
  SUPPLIER: supplierTerms,
  EXECUTOR: executorTerms,
};

export function getAccountTerms(role: AccountTermsRole): AccountTermsBlock {
  return BY_ROLE[role];
}

export function resolveRegisterTermsRole(
  accountPath: "CUSTOMER" | "PROFESSIONAL",
  partnerRole: "SUPPLIER" | "EXECUTOR",
): AccountTermsRole {
  if (accountPath === "CUSTOMER") return "CUSTOMER";
  return partnerRole;
}
