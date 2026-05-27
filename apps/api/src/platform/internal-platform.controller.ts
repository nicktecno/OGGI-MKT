import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SupplyQuantityKind } from '@prisma/client';
import Stripe from 'stripe';
import { InternalApiGuard } from '../commerce/internal-api.guard';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupplyService } from '../supply/supply.service';

@Controller('internal/platform')
@UseGuards(InternalApiGuard)
@SkipThrottle()
export class InternalPlatformController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supply: SupplyService,
    private readonly notifications: NotificationsService,
  ) {}

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
      include: {
        supplier: {
          select: {
            email: true,
            name: true,
            supplierProfile: { select: { businessName: true } },
          },
        },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      supplierEmail: r.supplier.email,
      supplier_name:
        r.supplier.supplierProfile?.businessName?.trim() ||
        r.supplier.name?.trim() ||
        r.supplier.email,
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

  @Get('supplier-accounts')
  async supplierAccounts() {
    const rows = await this.prisma.platformAccount.findMany({
      where: { role: 'SUPPLIER', status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        name: true,
        supplierProfile: { select: { businessName: true } },
      },
      orderBy: { email: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      label:
        r.supplierProfile?.businessName?.trim() || r.name?.trim() || r.email,
    }));
  }

  /** Admin: cria insumo só com especificações (sem custo); precificação na aba Peças. */
  @Post('catalog/supply-items')
  async createSupplyCatalogItem(
    @Body()
    body: {
      supplier_account_id: string;
      nome: string;
      sku_interno: string;
      quantidade_kind: SupplyQuantityKind;
      quantidade: number;
      observacao?: string;
      pacote_altura_cm?: number;
      pacote_largura_cm?: number;
      pacote_comprimento_cm?: number;
      pacote_peso_kg?: number;
    },
  ) {
    const qk = body.quantidade_kind;
    if (!Object.values(SupplyQuantityKind).includes(qk)) {
      throw new BadRequestException('quantidade_kind inválido (METRO ou PECA).');
    }
    if (!body.supplier_account_id?.trim()) {
      throw new BadRequestException('supplier_account_id é obrigatório.');
    }
    return this.supply.createSpecsForSupplier({
      supplierAccountId: body.supplier_account_id.trim(),
      nome: body.nome ?? '',
      skuInterno: body.sku_interno ?? '',
      quantidadeKind: qk,
      quantidade: body.quantidade,
      observacao: body.observacao,
      pacoteAlturaCm: body.pacote_altura_cm,
      pacoteLarguraCm: body.pacote_largura_cm,
      pacoteComprimentoCm: body.pacote_comprimento_cm,
      pacotePesoKg: body.pacote_peso_kg,
    });
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
    const executors = rows.map((a) => {
      const p = a.executorProfile;
      const city = p?.city?.trim() ?? '';
      const uf = p?.stateUf?.trim().toUpperCase() ?? '';
      return {
        email: a.email,
        displayName: (p?.displayName ?? a.name).trim(),
        cidade_origem: city && uf ? `${city} — ${uf}` : '',
        cep_origem: p?.cep?.trim() ?? '',
      };
    });
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
      fiscalDocumentKind: a.fiscalDocumentKind,
      fiscalDocument: a.fiscalDocument,
      supplierProfile: a.supplierProfile,
      executorProfile: a.executorProfile,
    }));
  }

  @Post('accounts/:id/approve')
  async approve(
    @Param('id') id: string,
    @Body() body: { reviewedByEmail?: string },
  ) {
    const acc = await this.prisma.platformAccount.findUnique({ where: { id } });
    if (!acc) throw new NotFoundException('Conta não encontrada.');
    await this.prisma.platformAccount.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        reviewedAt: new Date(),
        reviewedByEmail:
          body.reviewedByEmail?.trim() ||
          process.env.PLATFORM_ADMIN_EMAIL?.trim() ||
          'admin@modastore.com.br',
        rejectionReason: null,
      },
    });
    if (acc.role === 'SUPPLIER' || acc.role === 'EXECUTOR') {
      this.notifications.fireAndForgetAccountApproved({
        email: acc.email,
        name: acc.name,
        role: acc.role,
      });
    }
    return { ok: true };
  }

  @Post('accounts/:id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { reason?: string; reviewedByEmail?: string },
  ) {
    const acc = await this.prisma.platformAccount.findUnique({ where: { id } });
    if (!acc) throw new NotFoundException('Conta não encontrada.');
    const reason = body.reason?.trim() || 'Cadastro recusado.';
    await this.prisma.platformAccount.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedByEmail:
          body.reviewedByEmail?.trim() ||
          process.env.PLATFORM_ADMIN_EMAIL?.trim() ||
          'admin@modastore.com.br',
        rejectionReason: reason,
      },
    });
    if (acc.role === 'SUPPLIER' || acc.role === 'EXECUTOR') {
      this.notifications.fireAndForgetAccountRejected({
        email: acc.email,
        name: acc.name,
        role: acc.role,
        reason,
      });
    }
    return { ok: true };
  }
}
