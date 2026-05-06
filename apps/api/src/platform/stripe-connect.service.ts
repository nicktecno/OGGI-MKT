import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

const MSG_CONNECT_NAO_ATIVO =
  'O Stripe Connect ainda não está ativado na conta Stripe da plataforma (a mesma onde foi gerada a chave secreta usada na API). ' +
  'Quem gere o site precisa de: 1) entrar no painel Stripe em https://dashboard.stripe.com/settings/connect ; ' +
  '2) concluir a ativação do Connect para a entidade (empresa) da plataforma; ' +
  '3) em modo teste, confirmar que também está disponível no modo de teste. ' +
  'Depois disso, volte aqui e clique outra vez em «Conectar conta Stripe».';

@Injectable()
export class StripeConnectService {
  private readonly log = new Logger(StripeConnectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAccountLink(accountId: string): Promise<{ url: string | null; message?: string }> {
    const acc = await this.prisma.platformAccount.findUnique({ where: { id: accountId } });
    if (!acc) throw new BadRequestException('Conta não encontrada.');
    if (acc.status !== 'ACTIVE') {
      throw new BadRequestException('O cadastro precisa estar aprovado antes de conectar o Stripe.');
    }
    if (acc.role !== 'SUPPLIER' && acc.role !== 'EXECUTOR') {
      throw new BadRequestException('Stripe Connect é apenas para fornecedor ou executor.');
    }
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      return {
        url: null,
        message:
          'Pagamentos Stripe não estão configurados neste servidor. Em desenvolvimento, use o painel normalmente.',
      };
    }
    const stripe = new Stripe(key, { typescript: true });
    let stripeAccountId = acc.stripeAccountId;

    try {
      if (!stripeAccountId) {
        const created = await stripe.accounts.create({
          type: 'express',
          country: 'BR',
          email: acc.email,
          business_type: 'individual',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        stripeAccountId = created.id;
        await this.prisma.platformAccount.update({
          where: { id: acc.id },
          data: { stripeAccountId },
        });
      }
      const base =
        process.env.STRIPE_CONNECT_BASE_URL?.trim() ||
        process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
        'http://localhost:3000';
      const panelPath = acc.role === 'EXECUTOR' ? '/painel/executor' : '/painel/fornecedor';
      const defaultReturn = `${base.replace(/\/$/, '')}${panelPath}`;
      const refresh = process.env.STRIPE_CONNECT_REFRESH_URL?.trim() || defaultReturn;
      const ret = process.env.STRIPE_CONNECT_RETURN_URL?.trim() || defaultReturn;
      const link = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refresh,
        return_url: ret,
        type: 'account_onboarding',
      });
      return { url: link.url };
    } catch (e: unknown) {
      const stripeMsg = e instanceof Stripe.errors.StripeError ? e.message : '';
      this.log.warn(`Stripe Connect account-link falhou: ${stripeMsg || String(e)}`);

      if (
        /signed up for Connect|only create new accounts.*Connect|Connect.*not.*enabled|You need to.*Connect/i.test(
          stripeMsg,
        )
      ) {
        return { url: null, message: MSG_CONNECT_NAO_ATIVO };
      }

      if (e instanceof Stripe.errors.StripeInvalidRequestError) {
        return {
          url: null,
          message:
            'O Stripe recusou o pedido. Confirme que a conta da plataforma tem Connect ativo, que as chaves (teste/live) correspondem a essa conta e que o país/capacidades pedidas são permitidos. Se precisar de ajuda, contacte quem gere os pagamentos do site.',
        };
      }

      return {
        url: null,
        message:
          'Não foi possível abrir o cadastro Stripe neste momento. Tente novamente em alguns minutos ou confirme a conexão com a internet e com a API.',
      };
    }
  }
}
