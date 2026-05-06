import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { CompositeProduct, ExecutionRequest, ProductionAssignment } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { marketplaceUploadContentType } from '../storage/marketplace-upload-mime';
import { R2StorageService } from '../storage/r2-storage.service';
import { SupplierFulfillmentService } from '../supply/supplier-fulfillment.service';

/** Resposta alinhada a `DemoCommerceState` do app web (snake_case). */
export type CommerceStateDto = {
  products: Record<string, unknown>[];
  executionRequests: Record<string, unknown>[];
  productionAssignments: Record<string, unknown>[];
};

const ROUPA_LETTERS = ['P', 'M', 'G', 'GG', 'XG'] as const;
const ROUPA_TAMANHOS = [...ROUPA_LETTERS, 'Único'] as const;
const ROUPA_LETTER_SET = new Set<string>(ROUPA_LETTERS);

@Injectable()
export class CommerceService {
  private readonly log = new Logger(CommerceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly r2: R2StorageService,
    private readonly supplierFulfillment: SupplierFulfillmentService,
  ) {}

  private parseVariacoesTamanhoInput(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
      throw new BadRequestException(
        'Informe variacoes_tamanho: lista de tamanhos, ex.: ["P","M","G"].',
      );
    }
    const seen = new Set<string>();
    for (const x of raw) {
      if (typeof x !== 'string') continue;
      const t = x.trim();
      const de = t
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      if (de === 'unico') {
        seen.add('Único');
        continue;
      }
      const up = t.toUpperCase();
      if (!ROUPA_LETTER_SET.has(up)) {
        throw new BadRequestException(
          `Tamanho inválido: "${x}". Use apenas: ${[...ROUPA_TAMANHOS].join(', ')}.`,
        );
      }
      seen.add(up);
    }
    if (seen.size === 0) {
      throw new BadRequestException('Escolha pelo menos um tamanho (P, M, G, GG, XG ou Único).');
    }
    return [...ROUPA_TAMANHOS].filter((t) => seen.has(t));
  }

  private parseVariacoesTamanhoStored(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    for (const x of value) {
      if (typeof x !== 'string') continue;
      const t = x.trim();
      const de = t
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      if (de === 'unico') {
        seen.add('Único');
        continue;
      }
      const up = t.toUpperCase();
      if (ROUPA_LETTER_SET.has(up)) seen.add(up);
    }
    return [...ROUPA_TAMANHOS].filter((t) => seen.has(t));
  }

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

  /** Após criar linhas de fulfillment: grava frete B2B total no produto, recalcula preço ao cliente e congela taxas/preço. */
  private async applyFreightLockAfterAssignment(
    productId: string,
    freteTotal: number,
  ): Promise<void> {
    const product = await this.prisma.compositeProduct.findUnique({ where: { id: productId } });
    if (!product || product.precoVendaCongelado) return;
    const materials = this.sumMateriaisFromLinhasJson(product.linhas);
    await this.prisma.compositeProduct.update({
      where: { id: productId },
      data: {
        precoVendaPublico: materials + freteTotal + product.executorFeePlanejada + product.platformFeePlanejada,
        freteInsumosAtribuicaoReais: freteTotal,
        precoVendaCongelado: true,
      },
    });
  }

  /** Soma quantidade × snapshot por linha na montagem (JSON em `linhas`). */
  private sumMateriaisFromLinhasJson(linhas: unknown): number {
    if (!Array.isArray(linhas)) return 0;
    let sum = 0;
    for (const row of linhas) {
      if (typeof row !== 'object' || row === null) continue;
      const r = row as Record<string, unknown>;
      const qRaw = r.quantidade;
      const q = typeof qRaw === 'number' ? qRaw : Number(qRaw);
      const cRaw = r.snapshot_custo_unitario;
      const c = typeof cRaw === 'number' ? cRaw : Number(cRaw);
      if (Number.isFinite(q) && Number.isFinite(c)) sum += q * c;
    }
    return sum;
  }

  private parseLinhasStructured(linhas: unknown): Array<{
    supplyItemId: string;
    quantidade: number;
    snapshot_custo_unitario: number;
  }> {
    if (!Array.isArray(linhas)) return [];
    const out: Array<{
      supplyItemId: string;
      quantidade: number;
      snapshot_custo_unitario: number;
    }> = [];
    for (const row of linhas) {
      if (typeof row !== 'object' || row === null) continue;
      const r = row as Record<string, unknown>;
      const sidRaw = r.supplyItemId ?? r.supply_item_id;
      const sid = typeof sidRaw === 'string' ? sidRaw : '';
      const qRaw = r.quantidade;
      const q = typeof qRaw === 'number' ? qRaw : Number(qRaw);
      const cRaw = r.snapshot_custo_unitario;
      const c = typeof cRaw === 'number' ? cRaw : Number(cRaw);
      if (!sid || !Number.isFinite(q)) continue;
      out.push({
        supplyItemId: sid,
        quantidade: q,
        snapshot_custo_unitario: Number.isFinite(c) ? c : 0,
      });
    }
    return out;
  }

  /** Atualiza só os valores unitários; insumo e quantidade vêm do cadastro da peça. */
  private mergeLinhasPrecificacao(
    rows: { supply_item_id: string; quantidade: number; snapshot_custo_unitario: number }[],
    existingJson: unknown,
  ): Array<{ supplyItemId: string; quantidade: number; snapshot_custo_unitario: number }> {
    const existing = this.parseLinhasStructured(existingJson);
    if (rows.length !== existing.length) {
      throw new BadRequestException(
        'A montagem não coincide com a peça. Para mudar insumos ou quantidades, use o cadastro da peça.',
      );
    }
    const out: Array<{
      supplyItemId: string;
      quantidade: number;
      snapshot_custo_unitario: number;
    }> = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const ex = existing[i]!;
      const sid = row.supply_item_id?.trim();
      if (!sid || sid !== ex.supplyItemId) {
        throw new BadRequestException(
          'Insumos definidos no cadastro da peça não podem ser alterados nesta aba.',
        );
      }
      if (Math.abs(row.quantidade - ex.quantidade) > 1e-6) {
        throw new BadRequestException('Altere quantidades no cadastro da peça.');
      }
      const c = row.snapshot_custo_unitario;
      if (!Number.isFinite(c) || c < 0) {
        throw new BadRequestException('Cada linha precisa de snapshot_custo_unitario ≥ 0.');
      }
      out.push({
        supplyItemId: ex.supplyItemId,
        quantidade: ex.quantidade,
        snapshot_custo_unitario: c,
      });
    }
    return out;
  }

  async patchProduct(
    productId: string,
    body: {
      ativo?: boolean;
      admin_pausado?: boolean;
      /** Ignorado: o preço ao cliente é sempre derivado de materiais + taxas. */
      preco_venda_publico?: number;
      executor_fee_planejada?: number;
      platform_fee_planejada?: number;
      pacote_altura_cm?: number;
      pacote_largura_cm?: number;
      pacote_comprimento_cm?: number;
      pacote_peso_kg?: number;
      linhas?: { supply_item_id: string; quantidade: number; snapshot_custo_unitario: number }[];
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
      body.pacote_peso_kg !== undefined ||
      body.linhas !== undefined;
    if (!has) {
      throw new BadRequestException('Nenhum campo para atualizar.');
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
    const existing = await this.prisma.compositeProduct.findUnique({ where: { id: productId } });
    if (!existing) throw new NotFoundException('Peça não encontrada.');

    const execChanges =
      body.executor_fee_planejada !== undefined &&
      body.executor_fee_planejada !== existing.executorFeePlanejada;
    const platChanges =
      body.platform_fee_planejada !== undefined &&
      body.platform_fee_planejada !== existing.platformFeePlanejada;
    const precoChanges =
      body.preco_venda_publico !== undefined &&
      body.preco_venda_publico !== existing.precoVendaPublico;
    const pricingTouched = execChanges || platChanges || precoChanges;

    if (existing.precoVendaCongelado && pricingTouched) {
      throw new BadRequestException(
        'O preço ao cliente desta peça foi fixado ao vincular costureira e fretes dos insumos; não é possível alterar taxas ou preço por aqui.',
      );
    }
    if (existing.precoVendaCongelado && body.linhas !== undefined) {
      throw new BadRequestException(
        'A montagem e valores dos insumos não podem ser alterados após o preço ter sido fixado na atribuição.',
      );
    }

    let mergedLinhas:
      | Array<{ supplyItemId: string; quantidade: number; snapshot_custo_unitario: number }>
      | undefined;
    if (body.linhas !== undefined) {
      mergedLinhas = this.mergeLinhasPrecificacao(body.linhas, existing.linhas);
    }

    const nextExec =
      body.executor_fee_planejada !== undefined
        ? body.executor_fee_planejada
        : existing.executorFeePlanejada;
    const nextPlat =
      body.platform_fee_planejada !== undefined
        ? body.platform_fee_planejada
        : existing.platformFeePlanejada;

    const feeFieldsInBody =
      body.executor_fee_planejada !== undefined ||
      body.platform_fee_planejada !== undefined ||
      body.preco_venda_publico !== undefined;

    let precoComputed: number | undefined;
    if (!existing.precoVendaCongelado && (feeFieldsInBody || mergedLinhas !== undefined)) {
      const materials = this.sumMateriaisFromLinhasJson(mergedLinhas ?? existing.linhas);
      const fretePlanejado = existing.freteInsumosAtribuicaoReais ?? 0;
      precoComputed = materials + fretePlanejado + nextExec + nextPlat;
    }

    await this.prisma.compositeProduct.update({
      where: { id: productId },
      data: {
        ...(body.ativo !== undefined ? { ativo: body.ativo } : {}),
        ...(body.admin_pausado !== undefined ? { adminPausado: body.admin_pausado } : {}),
        ...(mergedLinhas !== undefined
          ? { linhas: mergedLinhas as unknown as Prisma.InputJsonValue }
          : {}),
        ...(precoComputed !== undefined ? { precoVendaPublico: precoComputed } : {}),
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

  /** Envia bytes para R2 e grava `imagemUrl` (capa da vitrine). */
  private async saveMarketplaceCoverImage(
    productId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (buffer.length === 0) {
      throw new BadRequestException('Ficheiro vazio.');
    }
    if (buffer.length > 1024 * 1024) {
      throw new BadRequestException('A imagem não pode ultrapassar 1 MB.');
    }
    const contentType = marketplaceUploadContentType(mimeType);
    const key = this.r2.marketplaceProductImageKey(productId);
    const url = await this.r2.putPublicObject({
      key,
      body: buffer,
      contentType,
    });
    await this.prisma.compositeProduct.update({
      where: { id: productId },
      data: { imagemUrl: url },
    });
    return url;
  }

  /** Envia WebP ou JPEG (≤ 1 MB) para Cloudflare R2 e grava `imagemUrl` na peça. */
  async uploadProductImage(
    productId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ url: string }> {
    const existing = await this.prisma.compositeProduct.findUnique({
      where: { id: productId },
      select: { imagemUrl: true },
    });
    if (!existing) throw new NotFoundException('Peça não encontrada.');
    const previousCover = existing.imagemUrl?.trim() ?? '';
    const url = await this.saveMarketplaceCoverImage(productId, buffer, mimeType);
    if (previousCover && previousCover !== url.trim()) {
      await this.r2.deletePublicObjectByUrlBestEffort(previousCover);
    }
    return { url };
  }

  async createCompositeProduct(body: {
    nome: string;
    slug?: string;
    /** Se vazio ou omitido, gera automaticamente a partir do id da peça (ex.: `MS-A1B2C3D4E5F6`). */
    sku?: string;
    descricao_curta: string;
    linhas: { supply_item_id: string; quantidade: number }[];
    variacoes_tamanho: string[];
  },
  cover?: { buffer: Buffer; mimeType: string },
  ): Promise<{ id: string; slug: string; sku: string }> {
    const nome = body.nome.trim();
    const skuInput = typeof body.sku === 'string' ? body.sku.trim() : '';
    const desc = body.descricao_curta.trim();
    if (nome.length < 2) throw new BadRequestException('Nome muito curto.');
    if (desc.length < 4) throw new BadRequestException('Descrição muito curta.');
    if (!body.linhas?.length) {
      throw new BadRequestException('Inclua pelo menos um insumo na montagem.');
    }

    const variacoesTamanho = this.parseVariacoesTamanhoInput(body.variacoes_tamanho);

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
      const custoUnit =
        Math.max(0, (item.custoFornecedor ?? 0) + (item.freteAteExecutor ?? 0));
      linhasPayload.push({
        supplyItemId: item.id,
        quantidade: q,
        snapshot_custo_unitario: custoUnit,
      });
    }

    const materiaisSoma = linhasPayload.reduce(
      (acc, row) => acc + row.quantidade * row.snapshot_custo_unitario,
      0,
    );

    const id = `cp-${randomUUID().slice(0, 12)}`;
    const sku = skuInput || `MS-${id.slice(3).toUpperCase()}`;
    await this.prisma.compositeProduct.create({
      data: {
        id,
        slug,
        nome,
        sku,
        descricaoCurta: desc,
        linhas: linhasPayload as unknown as Prisma.InputJsonValue,
        executorFeePlanejada: 0,
        platformFeePlanejada: 0,
        precoVendaPublico: materiaisSoma,
        ativo: true,
        adminPausado: false,
        imagemUrl:
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=88',
        galeriaImagens: [] as unknown as Prisma.InputJsonValue,
        variacoesTamanho: variacoesTamanho as unknown as Prisma.InputJsonValue,
        pacoteAlturaCm: 22,
        pacoteLarguraCm: 18,
        pacoteComprimentoCm: 8,
        pacotePesoKg: 0.55,
      },
    });

    if (cover && cover.buffer.length > 0) {
      try {
        await this.saveMarketplaceCoverImage(id, cover.buffer, cover.mimeType);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.log.warn(
          `Capa não enviada ao R2 para peça ${id} (${slug}); mantida imagem por omissão. Causa: ${msg}`,
        );
      }
    }

    return { id, slug, sku };
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
    const { assignmentId, compositeProductId } = await this.prisma.$transaction(async (tx) => {
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
      return { assignmentId: created.id, compositeProductId: req.compositeProductId };
    });
    const { freteTotal } = await this.supplierFulfillment.syncFromAssignment(assignmentId);
    await this.applyFreightLockAfterAssignment(compositeProductId, freteTotal);
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
    const { freteTotal } = await this.supplierFulfillment.syncFromAssignment(created.id);
    await this.applyFreightLockAfterAssignment(input.compositeProductId, freteTotal);
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

  async patchAssignmentStorefrontHighlight(
    assignmentId: string,
    body: { storefront_highlight_order: number | null },
  ): Promise<void> {
    const v = body.storefront_highlight_order;
    if (v !== null && (!Number.isInteger(v) || v < 0)) {
      throw new BadRequestException('storefront_highlight_order deve ser inteiro ≥ 0 ou null.');
    }
    const count = await this.prisma.productionAssignment.count({ where: { id: assignmentId } });
    if (count === 0) throw new NotFoundException('Não encontramos essa combinação.');
    await this.prisma.productionAssignment.update({
      where: { id: assignmentId },
      data: { storefrontHighlightOrder: v },
    });
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

  /**
   * Baixa estoque vendável (`availableQuantity`) por linha de checkout.
   * Transação atómica; falha se alguma linha não estiver PUBLISHED ou sem estoque.
   */
  async reserveCheckoutLines(lines: { listing_id: string; quantity: number }[]): Promise<void> {
    if (!Array.isArray(lines) || lines.length === 0 || lines.length > 20) {
      throw new BadRequestException('Lista de linhas inválida (máx. 20).');
    }
    await this.prisma.$transaction(async (tx) => {
      for (const row of lines) {
        const id = typeof row.listing_id === 'string' ? row.listing_id.trim() : '';
        const q = row.quantity;
        if (!id) {
          throw new BadRequestException('listing_id inválido.');
        }
        if (!Number.isInteger(q) || q < 1 || q > 99) {
          throw new BadRequestException('Quantidade inválida.');
        }
        const r = await tx.productionAssignment.updateMany({
          where: {
            id,
            status: 'PUBLISHED',
            availableQuantity: { gte: q },
          },
          data: {
            availableQuantity: { decrement: q },
          },
        });
        if (r.count !== 1) {
          throw new ConflictException(
            'Estoque insuficiente ou oferta indisponível para uma das linhas do pedido.',
          );
        }
      }
    });
  }

  private parseProductGallery(value: unknown): string[] {
    if (value == null) return [];
    if (Array.isArray(value)) {
      return value
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((s) => s.trim());
    }
    return [];
  }

  /** Fotos extra (galeria, WebP ou JPEG) — até 8 URLs além da capa `imagemUrl`. */
  async uploadProductGalleryImage(
    productId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ url: string }> {
    const MAX_EXTRA = 8;
    if (buffer.length === 0) {
      throw new BadRequestException('Ficheiro vazio.');
    }
    if (buffer.length > 1024 * 1024) {
      throw new BadRequestException('A imagem não pode ultrapassar 1 MB.');
    }
    const contentType = marketplaceUploadContentType(mimeType);
    const p = await this.prisma.compositeProduct.findUnique({ where: { id: productId } });
    if (!p) throw new NotFoundException('Peça não encontrada.');
    const current = this.parseProductGallery(p.galeriaImagens);
    if (current.length >= MAX_EXTRA) {
      throw new BadRequestException(`Máximo de ${MAX_EXTRA} fotos extra na galeria.`);
    }
    const key = this.r2.marketplaceProductGalleryImageKey(productId);
    const url = await this.r2.putPublicObject({
      key,
      body: buffer,
      contentType,
    });
    const next = [...current, url];
    await this.prisma.compositeProduct.update({
      where: { id: productId },
      data: { galeriaImagens: next as unknown as Prisma.InputJsonValue },
    });
    return { url };
  }

  async removeProductGalleryImage(productId: string, imageUrl: string): Promise<void> {
    const p = await this.prisma.compositeProduct.findUnique({ where: { id: productId } });
    if (!p) throw new NotFoundException('Peça não encontrada.');
    const u = imageUrl.trim();
    if (!u) throw new BadRequestException('URL inválida.');
    if (u === p.imagemUrl.trim()) {
      throw new BadRequestException(
        'A foto de capa não pode ser removida por aqui — use “Substituir imagem da vitrine” ou remova uma foto extra da galeria.',
      );
    }
    const current = this.parseProductGallery(p.galeriaImagens);
    const next = current.filter((x) => x !== u);
    if (next.length === current.length) {
      throw new BadRequestException('Esta URL não está na galeria extra desta peça.');
    }
    await this.prisma.compositeProduct.update({
      where: { id: productId },
      data: { galeriaImagens: next as unknown as Prisma.InputJsonValue },
    });
    await this.r2.deletePublicObjectByUrlBestEffort(u);
  }

  /** Remove a peça, atribuições, pedidos de execução e linhas de cumprimento ligadas. */
  async deleteCompositeProduct(productId: string): Promise<void> {
    const product = await this.prisma.compositeProduct.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Peça não encontrada.');

    const imageUrlsToPurge = new Set<string>();
    const cover = product.imagemUrl?.trim();
    if (cover) imageUrlsToPurge.add(cover);
    for (const g of this.parseProductGallery(product.galeriaImagens)) {
      imageUrlsToPurge.add(g);
    }

    await this.prisma.$transaction(async (tx) => {
      const assignmentIds = (
        await tx.productionAssignment.findMany({
          where: { compositeProductId: productId },
          select: { id: true },
        })
      ).map((a) => a.id);

      if (assignmentIds.length > 0) {
        await tx.supplierFulfillmentLine.deleteMany({
          where: { productionAssignmentId: { in: assignmentIds } },
        });
        await tx.productionAssignment.deleteMany({ where: { compositeProductId: productId } });
      }
      await tx.executionRequest.deleteMany({ where: { compositeProductId: productId } });
      await tx.compositeProduct.delete({ where: { id: productId } });
    });

    for (const url of imageUrlsToPurge) {
      await this.r2.deletePublicObjectByUrlBestEffort(url);
    }
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
      frete_insumos_atribuicao_reais: p.freteInsumosAtribuicaoReais ?? null,
      preco_venda_congelado: p.precoVendaCongelado,
      ativo: p.ativo,
      admin_pausado: p.adminPausado,
      imagem_url: p.imagemUrl,
      galeria_imagens: this.parseProductGallery(p.galeriaImagens),
      pacote_altura_cm: p.pacoteAlturaCm,
      pacote_largura_cm: p.pacoteLarguraCm,
      pacote_comprimento_cm: p.pacoteComprimentoCm,
      pacote_peso_kg: p.pacotePesoKg,
      variacoes_tamanho: this.parseVariacoesTamanhoStored(p.variacoesTamanho),
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
      storefront_highlight_order: a.storefrontHighlightOrder ?? null,
    };
  }
}
