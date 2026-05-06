import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { PlatformJwtGuard, type PlatformJwtUser } from '../auth/platform-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PatchMeDto } from './dto/patch-me.dto';
import { assertValidFiscalDocument, type FiscalDocumentKind } from './fiscal-document.util';

class PatchSupplierProfileDto {
  businessName?: string;
  cep?: string;
  phone?: string;
  addressLine1?: string;
  addressComplement?: string;
  city?: string;
  stateUf?: string;
}

class PatchExecutorProfileDto {
  displayName?: string;
  cep?: string;
  phone?: string;
  addressLine1?: string;
  addressComplement?: string;
  city?: string;
  stateUf?: string;
}

@Controller('accounts')
@UseGuards(PlatformJwtGuard)
export class AccountsMeController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch('me')
  async patchMe(@Req() req: Request & { platformUser: PlatformJwtUser }, @Body() body: PatchMeDto) {
    const hasName = body.name !== undefined;
    const hasFiscal = body.fiscalDocument !== undefined || body.fiscalDocumentKind !== undefined;
    if (!hasName && !hasFiscal) {
      throw new BadRequestException('Nada para atualizar.');
    }

    const current = await this.prisma.platformAccount.findUnique({
      where: { id: req.platformUser.sub },
      select: { fiscalDocumentKind: true, fiscalDocument: true },
    });
    if (!current) throw new BadRequestException('Conta não encontrada.');

    const data: Prisma.PlatformAccountUpdateInput = {};

    if (body.name !== undefined) {
      const name = String(body.name ?? '').trim();
      if (name.length < 2 || name.length > 120) {
        throw new BadRequestException('Nome deve ter entre 2 e 120 caracteres.');
      }
      data.name = name;
    }

    if (body.fiscalDocument !== undefined || body.fiscalDocumentKind !== undefined) {
      const kind = (body.fiscalDocumentKind ??
        current.fiscalDocumentKind) as FiscalDocumentKind;
      const raw =
        body.fiscalDocument !== undefined
          ? String(body.fiscalDocument)
          : current.fiscalDocument ?? '';
      if (!raw.trim()) {
        throw new BadRequestException('Informe o CPF ou o CNPJ completo.');
      }
      const digits = assertValidFiscalDocument(kind, raw);
      data.fiscalDocumentKind = kind;
      data.fiscalDocument = digits;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nada para atualizar.');
    }

    await this.prisma.platformAccount.update({
      where: { id: req.platformUser.sub },
      data,
    });
    return { ok: true as const };
  }

  @Get('me/store-orders')
  async myStoreOrders(@Req() req: Request & { platformUser: PlatformJwtUser }) {
    if (req.platformUser.role !== 'CUSTOMER') {
      throw new BadRequestException('Somente contas de cliente podem ver pedidos da loja.');
    }
    const orders = await this.prisma.storeCustomerOrder.findMany({
      where: { accountId: req.platformUser.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        lines: {
          orderBy: { productName: 'asc' },
        },
      },
    });
    return orders.map((o) => ({
      id: o.id,
      created_at: o.createdAt.toISOString(),
      channel: o.channel,
      stripe_session_id: o.stripeSessionId,
      total_brl: o.totalBrl,
      delivery: o.delivery,
      lines: o.lines.map((l) => ({
        id: l.id,
        listing_id: l.listingId,
        product_slug: l.productSlug,
        product_name: l.productName,
        quantity: l.quantity,
        unit_price_brl: l.unitPriceBrl,
        composite_product_id: l.compositeProductId,
        posted_at: l.postedAt ? l.postedAt.toISOString() : null,
        tracking_code: l.trackingCode,
        carrier_name: l.carrierName,
      })),
    }));
  }

  @Get('me')
  async me(@Req() req: Request & { platformUser: PlatformJwtUser }) {
    const a = await this.prisma.platformAccount.findUnique({
      where: { id: req.platformUser.sub },
      include: { supplierProfile: true, executorProfile: true },
    });
    if (!a) throw new BadRequestException('Conta não encontrada.');
    return {
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      status: a.status,
      stripeOnboardingComplete: a.stripeOnboardingComplete,
      hasStripeAccount: Boolean(a.stripeAccountId),
      fiscalDocumentKind: a.fiscalDocumentKind,
      fiscalDocument: a.fiscalDocument,
      supplierProfile: a.supplierProfile,
      executorProfile: a.executorProfile,
    };
  }

  @Patch('me/supplier')
  async patchSupplier(
    @Req() req: Request & { platformUser: PlatformJwtUser },
    @Body() body: PatchSupplierProfileDto,
  ) {
    if (req.platformUser.role !== 'SUPPLIER') {
      throw new BadRequestException('Esta conta não é fornecedor.');
    }
    const prof = await this.prisma.supplierProfile.findUnique({
      where: { accountId: req.platformUser.sub },
    });
    if (!prof) throw new BadRequestException('Perfil de fornecedor não encontrado.');
    await this.prisma.supplierProfile.update({
      where: { id: prof.id },
      data: {
        ...(body.businessName !== undefined ? { businessName: body.businessName.trim() } : {}),
        ...(body.cep !== undefined ? { cep: body.cep.trim() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
        ...(body.addressLine1 !== undefined ? { addressLine1: body.addressLine1.trim() } : {}),
        ...(body.addressComplement !== undefined
          ? { addressComplement: body.addressComplement?.trim() || null }
          : {}),
        ...(body.city !== undefined ? { city: body.city.trim() } : {}),
        ...(body.stateUf !== undefined ? { stateUf: body.stateUf.trim().toUpperCase() } : {}),
      },
    });
    return { ok: true };
  }

  @Patch('me/executor')
  async patchExecutor(
    @Req() req: Request & { platformUser: PlatformJwtUser },
    @Body() body: PatchExecutorProfileDto,
  ) {
    if (req.platformUser.role !== 'EXECUTOR') {
      throw new BadRequestException('Esta conta não é executor.');
    }
    const prof = await this.prisma.executorProfile.findUnique({
      where: { accountId: req.platformUser.sub },
    });
    if (!prof) throw new BadRequestException('Perfil de executor não encontrado.');
    await this.prisma.executorProfile.update({
      where: { id: prof.id },
      data: {
        ...(body.displayName !== undefined ? { displayName: body.displayName.trim() } : {}),
        ...(body.cep !== undefined ? { cep: body.cep.trim() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
        ...(body.addressLine1 !== undefined ? { addressLine1: body.addressLine1.trim() } : {}),
        ...(body.addressComplement !== undefined
          ? { addressComplement: body.addressComplement?.trim() || null }
          : {}),
        ...(body.city !== undefined ? { city: body.city.trim() } : {}),
        ...(body.stateUf !== undefined ? { stateUf: body.stateUf.trim().toUpperCase() } : {}),
      },
    });
    return { ok: true };
  }
}
