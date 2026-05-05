import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { CompositeProduct, ExecutionRequest, ProductionAssignment } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { SupplierFulfillmentService } from '../supply/supplier-fulfillment.service';

/** Resposta alinhada a `DemoCommerceState` do app web (snake_case). */
export type CommerceStateDto = {
  products: Record<string, unknown>[];
  executionRequests: Record<string, unknown>[];
  productionAssignments: Record<string, unknown>[];
};

@Injectable()
export class CommerceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly r2: R2StorageService,
    private readonly supplierFulfillment: SupplierFulfillmentService,
  ) {}

  async getState(): Promise<CommerceStateDto> {
    const [products, executionRequests, productionAssignments] = await Promise.all([
      this.prisma.compositeProduct.findMany(),
      this.prisma.executionRequest.findMany(),
      this.prisma.productionAssignment.findMany(),
    ]);
    return {
      products: products.map((p) => this.toProductDto(p)),
      executionRequests: executionRequests.map((r) => this.toRequestDto(r)),
      productionAssignments: productionAssignments.map((a) => this.toAssignmentDto(a)),
    };
  }

  async patchProduct(
    productId: string,
    body: {
      ativo?: boolean;
      admin_pausado?: boolean;
      preco_venda_publico?: number;
      executor_fee_planejada?: number;
      platform_fee_planejada?: number;
      pacote_altura_cm?: number;
      pacote_largura_cm?: number;
      pacote_comprimento_cm?: number;
      pacote_peso_kg?: number;
    },
  ): Promise<void> {
    const has =
      body.ativo !== undefined ||
      body.admin_pausado !== undefined ||
      body.preco_venda_publico !== undefined ||
      body.executor_fee_planejada !== undefined ||
      body.platform_fee_planejada !== undefined ||
      body.pacote_altura_cm !== undefined ||
      body.pacote_largura_cm !== undefined ||
      body.pacote_comprimento_cm !== undefined ||
      body.pacote_peso_kg !== undefined;
    if (!has) {
      throw new BadRequestException('Nenhum campo para atualizar.');
    }
    if (
      body.preco_venda_publico !== undefined &&
      (!Number.isFinite(body.preco_venda_publico) || body.preco_venda_publico < 0)
    ) {
      throw new BadRequestException('preço inválido');
    }
    if (
      body.executor_fee_planejada !== undefined &&
      (!Number.isFinite(body.executor_fee_planejada) || body.executor_fee_planejada < 0)
    ) {
      throw new BadRequestException('executor_fee inválido');
    }
    if (
      body.platform_fee_planejada !== undefined &&
      (!Number.isFinite(body.platform_fee_planejada) || body.platform_fee_planejada < 0)
    ) {
      throw new BadRequestException('platform_fee inválido');
    }
    if (body.pacote_altura_cm !== undefined) {
      if (!Number.isFinite(body.pacote_altura_cm) || body.pacote_altura_cm < 0.1) {
        throw new BadRequestException('pacote_altura_cm inválido (mín. 0,1 cm).');
      }
    }
    if (body.pacote_largura_cm !== undefined) {
      if (!Number.isFinite(body.pacote_largura_cm) || body.pacote_largura_cm < 0.1) {
        throw new BadRequestException('pacote_largura_cm inválido (mín. 0,1 cm).');
      }
    }
    if (body.pacote_comprimento_cm !== undefined) {
      if (!Number.isFinite(body.pacote_comprimento_cm) || body.pacote_comprimento_cm < 0.1) {
        throw new BadRequestException('pacote_comprimento_cm inválido (mín. 0,1 cm).');
      }
    }
    if (body.pacote_peso_kg !== undefined) {
      if (!Number.isFinite(body.pacote_peso_kg) || body.pacote_peso_kg < 0.01) {
        throw new BadRequestException('pacote_peso_kg inválido (mín. 0,01 kg).');
      }
    }
    const count = await this.prisma.compositeProduct.count({ where: { id: productId } });
    if (count === 0) throw new NotFoundException('Peça não encontrada.');
    await this.prisma.compositeProduct.update({
      where: { id: productId },
      data: {
        ...(body.ativo !== undefined ? { ativo: body.ativo } : {}),
        ...(body.admin_pausado !== undefined ? { adminPausado: body.admin_pausado } : {}),
        ...(body.preco_venda_publico !== undefined
          ? { precoVendaPublico: body.preco_venda_publico }
          : {}),
        ...(body.executor_fee_planejada !== undefined
          ? { executorFeePlanejada: body.executor_fee_planejada }
          : {}),
        ...(body.platform_fee_planejada !== undefined
          ? { platformFeePlanejada: body.platform_fee_planejada }
          : {}),
        ...(body.pacote_altura_cm !== undefined ? { pacoteAlturaCm: body.pacote_altura_cm } : {}),
        ...(body.pacote_largura_cm !== undefined ? { pacoteLarguraCm: body.pacote_largura_cm } : {}),
        ...(body.pacote_comprimento_cm !== undefined
          ? { pacoteComprimentoCm: body.pacote_comprimento_cm }
          : {}),
        ...(body.pacote_peso_kg !== undefined ? { pacotePesoKg: body.pacote_peso_kg } : {}),
      },
    });
  }

  /** Envia WebP (≤ 1 MB) para Cloudflare R2 e grava `imagemUrl` na peça. */
  async uploadProductImage(
    productId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ url: string }> {
    if (buffer.length === 0) {
      throw new BadRequestException('Ficheiro vazio.');
    }
    if (buffer.length > 1024 * 1024) {
      throw new BadRequestException('A imagem não pode ultrapassar 1 MB.');
    }
    const mime = mimeType.toLowerCase().split(';')[0]?.trim() ?? '';
    if (mime !== 'image/webp') {
      throw new BadRequestException('Envie apenas WebP (o painel comprime automaticamente antes do envio).');
    }
    const count = await this.prisma.compositeProduct.count({ where: { id: productId } });
    if (count === 0) throw new NotFoundException('Peça não encontrada.');
    const key = this.r2.marketplaceProductImageKey(productId);
    const url = await this.r2.putPublicObject({
      key,
      body: buffer,
      contentType: 'image/webp',
    });
    await this.prisma.compositeProduct.update({
      where: { id: productId },
      data: { imagemUrl: url },
    });
    return { url };
  }

  async createCompositeProduct(body: {
    nome: string;
    slug?: string;
    sku: string;
    descricao_curta: string;
    linhas: { supply_item_id: string; quantidade: number }[];
    preco_venda_publico?: number;
    executor_fee_planejada?: number;
    platform_fee_planejada?: number;
  }): Promise<{ id: string; slug: string }> {
    const nome = body.nome.trim();
    const sku = body.sku.trim();
    const desc = body.descricao_curta.trim();
    if (nome.length < 2) throw new BadRequestException('Nome muito curto.');
    if (!sku) throw new BadRequestException('SKU é obrigatório.');
    if (desc.length < 4) throw new BadRequestException('Descrição muito curta.');
    if (!body.linhas?.length) {
      throw new BadRequestException('Inclua pelo menos um insumo na montagem.');
    }

    let baseSlug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!baseSlug) {
      baseSlug = this.slugifyNome(nome);
    }

    let slug = baseSlug;
    let suffix = 0;
    while ((await this.prisma.compositeProduct.count({ where: { slug } })) > 0) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const linhasPayload: Array<{
      supplyItemId: string;
      quantidade: number;
      snapshot_custo_unitario: number;
    }> = [];

    for (const row of body.linhas) {
      const sid = row.supply_item_id?.trim();
      if (!sid) throw new BadRequestException('Cada linha precisa de um insumo.');
      const item = await this.prisma.supplyItem.findFirst({
        where: { id: sid, ativo: true },
      });
      if (!item) {
        throw new NotFoundException(`Insumo não encontrado ou inativo: ${sid}`);
      }
      const q = row.quantidade;
      if (!Number.isFinite(q) || q <= 0) {
        throw new BadRequestException('Quantidade por linha deve ser maior que zero.');
      }
      linhasPayload.push({
        supplyItemId: item.id,
        quantidade: q,
        snapshot_custo_unitario: item.custoFornecedor,
      });
    }

    const id = `cp-${randomUUID().slice(0, 12)}`;
    await this.prisma.compositeProduct.create({
      data: {
        id,
        slug,
        nome,
        sku,
        descricaoCurta: desc,
        linhas: linhasPayload as unknown as Prisma.InputJsonValue,
        executorFeePlanejada: body.executor_fee_planejada ?? 0,
        platformFeePlanejada: body.platform_fee_planejada ?? 0,
        precoVendaPublico: body.preco_venda_publico ?? 0,
        ativo: true,
        adminPausado: false,
        imagemUrl:
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=88',
        pacoteAlturaCm: 22,
        pacoteLarguraCm: 18,
        pacoteComprimentoCm: 8,
        pacotePesoKg: 0.55,
      },
    });

    return { id, slug };
  }

  private slugifyNome(nome: string): string {
    const s = nome
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72);
    return s || `peca-${randomUUID().slice(0, 8)}`;
  }

  async createPendingExecutionRequest(input: {
    compositeProductId: string;
    executorEmail: string;
    executorNome: string;
  }): Promise<{ id: string }> {
    const email = input.executorEmail.trim().toLowerCase();
    const nome = input.executorNome.trim();
    if (!email || !nome) {
      throw new BadRequestException('E-mail e nome são obrigatórios.');
    }
    const product = await this.prisma.compositeProduct.findUnique({
      where: { id: input.compositeProductId },
    });
    if (!product) throw new NotFoundException('Peça não encontrada.');
    const pendingSame = await this.prisma.executionRequest.findFirst({
      where: {
        compositeProductId: input.compositeProductId,
        executorEmail: email,
        status: 'PENDING',
      },
    });
    if (pendingSame) {
      throw new ConflictException('Já existe um pedido pendente para esta peça com este e-mail.');
    }
    const id = `req-${randomUUID().slice(0, 10)}`;
    await this.prisma.executionRequest.create({
      data: {
        id,
        compositeProductId: input.compositeProductId,
        executorEmail: email,
        executorNome: nome,
        status: 'PENDING',
      },
    });
    this.notifications.fireAndForgetPendingRequest({
      id,
      executorEmail: email,
      executorNome: nome,
      productNome: product.nome,
      productSku: product.sku,
    });
    return { id };
  }

  async approveExecutionRequest(requestId: string): Promise<void> {
    const assignmentId = await this.prisma.$transaction(async (tx) => {
      const req = await tx.executionRequest.findUnique({ where: { id: requestId } });
      if (!req) throw new NotFoundException('Pedido não encontrado.');
      if (req.status !== 'PENDING') {
        throw new BadRequestException('Este pedido não está mais pendente ou já foi respondido.');
      }
      const peers = await tx.productionAssignment.findMany({
        where: {
          compositeProductId: req.compositeProductId,
          status: { not: 'ARCHIVED' },
        },
      });
      const dup = peers.some(
        (a) => a.executorEmail.toLowerCase() === req.executorEmail.toLowerCase(),
      );
      if (dup) {
        throw new ConflictException('Já existe uma combinação ativa entre esta peça e esta costureira.');
      }
      const now = new Date();
      await tx.executionRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', reviewedAt: now },
      });
      const nome = req.executorNome.includes('Atelier')
        ? req.executorNome
        : `${req.executorNome} — Atelier`;
      const created = await tx.productionAssignment.create({
        data: {
          id: `asg-${randomUUID().slice(0, 8)}`,
          compositeProductId: req.compositeProductId,
          executorEmail: req.executorEmail.trim().toLowerCase(),
          executorNome: nome,
          cidadeOrigem: 'São Paulo — SP',
          cepOrigem: '01310-100',
          availableQuantity: 0,
          unitsProduced: 0,
          status: 'ASSIGNED',
          assignmentSource: 'REQUEST_APPROVED',
          executionRequestId: req.id,
        },
      });
      return created.id;
    });
    await this.supplierFulfillment.syncFromAssignment(assignmentId);
    this.notifications.fireAndForgetAssignment(assignmentId);
  }

  async rejectExecutionRequest(requestId: string, rejectionReason: string): Promise<void> {
    const req = await this.prisma.executionRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Pedido não encontrado.');
    if (req.status !== 'PENDING') {
      throw new BadRequestException('Este pedido não está mais pendente ou já foi respondido.');
    }
    const product = await this.prisma.compositeProduct.findUnique({
      where: { id: req.compositeProductId },
    });
    const now = new Date();
    const reason = rejectionReason.trim() || '(sem motivo informado)';
    await this.prisma.executionRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedAt: now,
        rejectionReason: reason,
      },
    });
    if (product) {
      this.notifications.fireAndForgetRejectedRequest({
        executorEmail: req.executorEmail,
        executorNome: req.executorNome,
        productNome: product.nome,
        reason,
      });
    }
  }

  async createDirectAssignment(input: {
    compositeProductId: string;
    executorEmail: string;
    executorNome: string;
    cidade_origem: string;
    cep_origem: string;
  }): Promise<void> {
    const email = input.executorEmail.trim().toLowerCase();
    const nome = input.executorNome.trim();
    if (!email || !nome || !input.cidade_origem.trim() || !input.cep_origem.trim()) {
      throw new BadRequestException('Preencha e-mail, nome, cidade e CEP.');
    }
    const product = await this.prisma.compositeProduct.findUnique({
      where: { id: input.compositeProductId },
    });
    if (!product) throw new NotFoundException('Peça não encontrada.');
    const peers = await this.prisma.productionAssignment.findMany({
      where: {
        compositeProductId: input.compositeProductId,
        status: { not: 'ARCHIVED' },
      },
    });
    const dup = peers.some((a) => a.executorEmail.toLowerCase() === email);
    if (dup) {
      throw new ConflictException('Já existe uma combinação ativa entre esta peça e esta costureira.');
    }
    const created = await this.prisma.productionAssignment.create({
      data: {
        id: `asg-${randomUUID().slice(0, 8)}`,
        compositeProductId: input.compositeProductId,
        executorEmail: email,
        executorNome: nome,
        cidadeOrigem: input.cidade_origem.trim(),
        cepOrigem: input.cep_origem.trim(),
        availableQuantity: 0,
        unitsProduced: 0,
        status: 'ASSIGNED',
        assignmentSource: 'ADMIN_DIRECT',
        executionRequestId: null,
      },
    });
    await this.supplierFulfillment.syncFromAssignment(created.id);
    this.notifications.fireAndForgetAssignment(created.id);
  }

  async archiveAssignment(assignmentId: string): Promise<void> {
    const a = await this.prisma.productionAssignment.findUnique({ where: { id: assignmentId } });
    if (!a) throw new NotFoundException('Não encontramos essa combinação.');
    await this.prisma.productionAssignment.update({
      where: { id: assignmentId },
      data: { status: 'ARCHIVED' },
    });
    await this.supplierFulfillment.deleteForAssignment(assignmentId);
  }

  /** Costureira libera a oferta na vitrine (estado PUBLISHED + estoque vendável). */
  async publishAssignment(
    assignmentId: string,
    body: { available_quantity: number },
  ): Promise<void> {
    const qty = body.available_quantity;
    if (!Number.isInteger(qty) || qty < 1) {
      throw new BadRequestException('Quantidade à venda deve ser um número inteiro ≥ 1.');
    }
    const a = await this.prisma.productionAssignment.findUnique({ where: { id: assignmentId } });
    if (!a) throw new NotFoundException('Atribuição não encontrada.');
    if (a.status === 'ARCHIVED') {
      throw new BadRequestException('Esta combinação foi encerrada.');
    }
    if (a.status === 'PUBLISHED') {
      throw new BadRequestException('Esta oferta já está publicada na loja.');
    }
    const nextUnits = Math.max(a.unitsProduced, qty);
    await this.prisma.productionAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'PUBLISHED',
        availableQuantity: qty,
        unitsProduced: nextUnits,
      },
    });
  }

  private toProductDto(p: CompositeProduct) {
    return {
      id: p.id,
      slug: p.slug,
      nome: p.nome,
      sku: p.sku,
      descricao_curta: p.descricaoCurta,
      linhas: p.linhas,
      executor_fee_planejada: p.executorFeePlanejada,
      platform_fee_planejada: p.platformFeePlanejada,
      preco_venda_publico: p.precoVendaPublico,
      ativo: p.ativo,
      admin_pausado: p.adminPausado,
      imagem_url: p.imagemUrl,
      pacote_altura_cm: p.pacoteAlturaCm,
      pacote_largura_cm: p.pacoteLarguraCm,
      pacote_comprimento_cm: p.pacoteComprimentoCm,
      pacote_peso_kg: p.pacotePesoKg,
    };
  }

  private toRequestDto(r: ExecutionRequest) {
    return {
      id: r.id,
      compositeProductId: r.compositeProductId,
      executorEmail: r.executorEmail,
      executorNome: r.executorNome,
      status: r.status,
      ...(r.reviewedAt ? { reviewed_at: r.reviewedAt.toISOString() } : {}),
      ...(r.rejectionReason ? { rejection_reason: r.rejectionReason } : {}),
    };
  }

  private toAssignmentDto(a: ProductionAssignment) {
    return {
      id: a.id,
      compositeProductId: a.compositeProductId,
      executorEmail: a.executorEmail,
      executorNome: a.executorNome,
      cidade_origem: a.cidadeOrigem,
      cep_origem: a.cepOrigem,
      available_quantity: a.availableQuantity,
      units_produced: a.unitsProduced,
      status: a.status,
      assignment_source: a.assignmentSource,
      execution_request_id: a.executionRequestId,
    };
  }
}
