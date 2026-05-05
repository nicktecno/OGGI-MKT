import { Controller, Get, Param, Post, Body, UseGuards, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { InternalApiGuard } from '../commerce/internal-api.guard';

@Controller('internal/platform')
@UseGuards(InternalApiGuard)
@SkipThrottle()
export class InternalPlatformController {
  constructor(private readonly prisma: PrismaService) {}

  private async listAllStripeCharges(
    stripe: InstanceType<typeof Stripe>,
  ): Promise<
    Array<{ id: string; paid: boolean; refunded: boolean; amount: number; application_fee_amount: number | null }>
  > {
    const out: Array<{ id: string; paid: boolean; refunded: boolean; amount: number; application_fee_amount: number | null }> = [];
    let startingAfter: string | undefined;
    for (let i = 0; i < 10; i++) {
      const page = await stripe.charges.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      out.push(...page.data);
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]?.id;
    }
    return out;
  }

  private async listAllStripeTransfers(
    stripe: InstanceType<typeof Stripe>,
  ): Promise<Array<{ id: string; amount: number; destination: unknown }>> {
    const out: Array<{ id: string; amount: number; destination: unknown }> = [];
    let startingAfter: string | undefined;
    for (let i = 0; i < 10; i++) {
      const page = await stripe.transfers.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      out.push(...page.data);
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]?.id;
    }
    return out;
  }

  @Get('catalog/supply-items')
  async supplyCatalog() {
    const rows = await this.prisma.supplyItem.findMany({
      where: { ativo: true },
      include: { supplier: { select: { email: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      supplierEmail: r.supplier.email,
      nome: r.nome,
      sku_interno: r.skuInterno,
      unidade: r.unidade,
      custo_fornecedor: r.custoFornecedor,
      frete_ate_executor: r.freteAteExecutor,
      ativo: r.ativo,
      imagem_url: r.imagemUrl,
      observacao: r.observacao,
      quantidade_kind: r.quantidadeKind,
      quantidade: r.quantidade,
      pacote_altura_cm: r.pacoteAlturaCm,
      pacote_largura_cm: r.pacoteLarguraCm,
      pacote_comprimento_cm: r.pacoteComprimentoCm,
      pacote_peso_kg: r.pacotePesoKg,
    }));
  }

  @Get('accounts/pending-count')
  async pendingCount() {
    const count = await this.prisma.platformAccount.count({
      where: { status: 'PENDING_ADMIN_REVIEW' },
    });
    return { count };
  }

  /**
   * Resumo financeiro Stripe para o admin:
   * - dados da conta da plataforma
   * - nº de vendas (charges pagas)
   * - comissão da plataforma
   * - total recebido por executores e fornecedores (transfers Connect)
   */
  @Get('stripe/admin-summary')
  async stripeAdminSummary() {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      return {
        configured: false,
        message: 'STRIPE_SECRET_KEY não configurada na API.',
      };
    }
    const stripe = new Stripe(key, { typescript: true });

    let account: Awaited<ReturnType<typeof stripe.accounts.retrieve>>;
    try {
      account = await stripe.accounts.retrieve(null);
    } catch (e) {
      throw new ServiceUnavailableException(
        `Não foi possível consultar a conta Stripe da plataforma: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    const [charges, transfers, partners] = await Promise.all([
      this.listAllStripeCharges(stripe),
      this.listAllStripeTransfers(stripe),
      this.prisma.platformAccount.findMany({
        where: { stripeAccountId: { not: null } },
        select: { stripeAccountId: true, role: true, email: true, name: true },
      }),
    ]);

    const successfulCharges = charges.filter((c) => c.paid && !c.refunded);
    const vendasCount = successfulCharges.length;
    const totalVendasCentavos = successfulCharges.reduce((acc, c) => acc + c.amount, 0);
    const platformTaxasCentavos = successfulCharges.reduce((acc, c) => acc + (c.application_fee_amount ?? 0), 0);

    const byStripeAccountId = new Map(
      partners
        .filter((p) => typeof p.stripeAccountId === 'string' && p.stripeAccountId.length > 0)
        .map((p) => [p.stripeAccountId as string, p]),
    );

    let executoresCentavos = 0;
    let fornecedoresCentavos = 0;
    for (const t of transfers) {
      const destinationId =
        typeof t.destination === 'string'
          ? t.destination
          : typeof t.destination === 'object' && t.destination && 'id' in t.destination
            ? String((t.destination as { id: unknown }).id ?? '')
            : '';
      if (!destinationId) continue;
      const to = byStripeAccountId.get(destinationId);
      if (!to) continue;
      if (to.role === 'EXECUTOR') executoresCentavos += t.amount;
      if (to.role === 'SUPPLIER') fornecedoresCentavos += t.amount;
    }

    const plataformaComissaoCentavos =
      platformTaxasCentavos > 0
        ? platformTaxasCentavos
        : Math.max(0, totalVendasCentavos - executoresCentavos - fornecedoresCentavos);

    return {
      configured: true,
      account: {
        id: account.id,
        email: account.email,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      },
      metrics: {
        vendas_count: vendasCount,
        total_vendas_centavos: totalVendasCentavos,
        plataforma_comissao_centavos: plataformaComissaoCentavos,
        executores_receberam_centavos: executoresCentavos,
        fornecedores_receberam_centavos: fornecedoresCentavos,
      },
      notes: {
        comissao_source:
          platformTaxasCentavos > 0
            ? 'application_fee_amount (Stripe Connect)'
            : 'estimada por diferença: vendas - transfers para parceiros',
      },
    };
  }

  @Get('accounts/executors')
  async activeExecutors() {
    const rows = await this.prisma.platformAccount.findMany({
      where: { role: 'EXECUTOR', status: 'ACTIVE' },
      include: { executorProfile: true },
      orderBy: { email: 'asc' },
    });
    const executors = rows.map((a) => ({
      email: a.email,
      displayName: (a.executorProfile?.displayName ?? a.name).trim(),
    }));
    return { executors };
  }

  @Get('accounts/pending')
  async pendingAccounts() {
    const rows = await this.prisma.platformAccount.findMany({
      where: { status: 'PENDING_ADMIN_REVIEW' },
      include: { supplierProfile: true, executorProfile: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      supplierProfile: a.supplierProfile,
      executorProfile: a.executorProfile,
    }));
  }

  @Post('accounts/:id/approve')
  async approve(
    @Param('id') id: string,
    @Body() body: { reviewedByEmail?: string },
  ) {
    await this.prisma.platformAccount.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        reviewedAt: new Date(),
        reviewedByEmail: body.reviewedByEmail?.trim() || 'admin@demo.local',
        rejectionReason: null,
      },
    });
    return { ok: true };
  }

  @Post('accounts/:id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { reason?: string; reviewedByEmail?: string },
  ) {
    await this.prisma.platformAccount.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedByEmail: body.reviewedByEmail?.trim() || 'admin@demo.local',
        rejectionReason: body.reason?.trim() || 'Cadastro recusado.',
      },
    });
    return { ok: true };
  }
}
