import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { InternalApiGuard } from '../commerce/internal-api.guard';

@Controller('internal/platform')
@UseGuards(InternalApiGuard)
@SkipThrottle()
export class InternalPlatformController {
  constructor(private readonly prisma: PrismaService) {}

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
