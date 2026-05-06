import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SupplyQuantityKind } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { PlatformJwtUser } from '../auth/platform-jwt.guard';
import { marketplaceUploadContentType } from '../storage/marketplace-upload-mime';
import { R2StorageService } from '../storage/r2-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSupplyItemDto } from './dto/create-supply-item.dto';
import type { UpdateSupplyItemDto } from './dto/update-supply-item.dto';

@Injectable()
export class SupplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2StorageService,
  ) {}

  private unidadeFromKind(kind: SupplyQuantityKind): string {
    return kind === SupplyQuantityKind.METRO ? 'm' : 'pc';
  }

  private assertSupplier(user: PlatformJwtUser) {
    if (user.role !== 'SUPPLIER') {
      throw new ForbiddenException('Apenas fornecedores gerenciam insumos.');
    }
    if (user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenException('Cadastro ainda não aprovado.');
    }
  }

  private toListRow(r: {
    id: string;
    nome: string;
    skuInterno: string;
    unidade: string;
    custoFornecedor: number | null;
    freteAteExecutor: number | null;
    ativo: boolean;
    imagemUrl: string | null;
    observacao: string | null;
    quantidadeKind: SupplyQuantityKind;
    quantidade: number;
    pacoteAlturaCm: number;
    pacoteLarguraCm: number;
    pacoteComprimentoCm: number;
    pacotePesoKg: number;
  }, email: string) {
    return {
      id: r.id,
      supplierEmail: email,
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
    };
  }

  async listForUser(user: PlatformJwtUser) {
    this.assertSupplier(user);
    const rows = await this.prisma.supplyItem.findMany({
      where: { supplierAccountId: user.sub },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.toListRow(r, user.email));
  }

  async create(user: PlatformJwtUser, dto: CreateSupplyItemDto) {
    this.assertSupplier(user);
    const id = `supply-${randomUUID().slice(0, 12)}`;
    const row = await this.prisma.supplyItem.create({
      data: {
        id,
        supplierAccountId: user.sub,
        nome: dto.nome.trim(),
        skuInterno: dto.skuInterno.trim(),
        unidade: this.unidadeFromKind(dto.quantidadeKind),
        quantidadeKind: dto.quantidadeKind,
        quantidade: dto.quantidade,
        custoFornecedor: dto.custoFornecedor !== undefined ? dto.custoFornecedor : null,
        freteAteExecutor: dto.freteAteExecutor !== undefined ? dto.freteAteExecutor : null,
        observacao: dto.observacao?.trim() || null,
        imagemUrl: dto.imagemUrl?.trim() || null,
        ativo: dto.ativo ?? true,
        pacoteAlturaCm: dto.pacoteAlturaCm ?? 14,
        pacoteLarguraCm: dto.pacoteLarguraCm ?? 12,
        pacoteComprimentoCm: dto.pacoteComprimentoCm ?? 5,
        pacotePesoKg: dto.pacotePesoKg ?? 0.4,
      },
    });
    return this.toListRow(row, user.email);
  }

  async update(user: PlatformJwtUser, id: string, dto: UpdateSupplyItemDto) {
    this.assertSupplier(user);
    const row = await this.prisma.supplyItem.findFirst({
      where: { id, supplierAccountId: user.sub },
    });
    if (!row) throw new NotFoundException('Insumo não encontrado.');
    const updated = await this.prisma.supplyItem.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
        ...(dto.skuInterno !== undefined ? { skuInterno: dto.skuInterno.trim() } : {}),
        ...(dto.custoFornecedor !== undefined ? { custoFornecedor: dto.custoFornecedor } : {}),
        ...(dto.freteAteExecutor !== undefined ? { freteAteExecutor: dto.freteAteExecutor } : {}),
        ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
        ...(dto.observacao !== undefined
          ? { observacao: dto.observacao.trim() || null }
          : {}),
        ...(dto.imagemUrl !== undefined ? { imagemUrl: dto.imagemUrl.trim() || null } : {}),
        ...(dto.quantidade !== undefined ? { quantidade: dto.quantidade } : {}),
        ...(dto.quantidadeKind !== undefined
          ? {
              quantidadeKind: dto.quantidadeKind,
              unidade: this.unidadeFromKind(dto.quantidadeKind),
            }
          : {}),
        ...(dto.pacoteAlturaCm !== undefined ? { pacoteAlturaCm: dto.pacoteAlturaCm } : {}),
        ...(dto.pacoteLarguraCm !== undefined ? { pacoteLarguraCm: dto.pacoteLarguraCm } : {}),
        ...(dto.pacoteComprimentoCm !== undefined ? { pacoteComprimentoCm: dto.pacoteComprimentoCm } : {}),
        ...(dto.pacotePesoKg !== undefined ? { pacotePesoKg: dto.pacotePesoKg } : {}),
      },
    });
    return this.toListRow(updated, user.email);
  }

  private async assertSupplyItemNotUsedInCompositeProducts(supplyItemId: string): Promise<void> {
    const products = await this.prisma.compositeProduct.findMany({
      select: { id: true, nome: true, linhas: true },
    });
    for (const p of products) {
      const linhas = p.linhas as unknown;
      if (!Array.isArray(linhas)) continue;
      for (const line of linhas as Record<string, unknown>[]) {
        const sid =
          typeof line.supplyItemId === 'string'
            ? line.supplyItemId
            : typeof line.supply_item_id === 'string'
              ? line.supply_item_id
              : null;
        if (sid === supplyItemId) {
          throw new ConflictException(
            `Este insumo está na montagem da peça «${p.nome}». Peça ao administrador para remover essa linha antes de apagar.`,
          );
        }
      }
    }
  }

  async delete(user: PlatformJwtUser, id: string): Promise<void> {
    this.assertSupplier(user);
    const row = await this.prisma.supplyItem.findFirst({
      where: { id, supplierAccountId: user.sub },
    });
    if (!row) throw new NotFoundException('Insumo não encontrado.');
    await this.assertSupplyItemNotUsedInCompositeProducts(id);
    await this.prisma.supplyItem.delete({ where: { id } });
  }

  async uploadImage(
    user: PlatformJwtUser,
    supplyItemId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ url: string }> {
    this.assertSupplier(user);
    if (!this.r2.isConfigured()) {
      throw new ServiceUnavailableException(
        'Armazenamento de imagens (R2) não configurado no servidor.',
      );
    }
    if (buffer.length === 0) throw new BadRequestException('Ficheiro vazio.');
    if (buffer.length > 1024 * 1024) {
      throw new BadRequestException('A imagem não pode ultrapassar 1 MB.');
    }
    const contentType = marketplaceUploadContentType(mimeType);
    const row = await this.prisma.supplyItem.findFirst({
      where: { id: supplyItemId, supplierAccountId: user.sub },
    });
    if (!row) throw new NotFoundException('Insumo não encontrado.');
    const key = this.r2.supplyItemImageKey(supplyItemId);
    const url = await this.r2.putPublicObject({
      key,
      body: buffer,
      contentType,
    });
    await this.prisma.supplyItem.update({
      where: { id: supplyItemId },
      data: { imagemUrl: url },
    });
    return { url };
  }

  /** Cadastro pelo admin (API interna): especificações apenas; precificação na montagem da peça. */
  async createSpecsForSupplier(input: {
    supplierAccountId: string;
    nome: string;
    skuInterno: string;
    quantidadeKind: SupplyQuantityKind;
    quantidade: number;
    observacao?: string;
    pacoteAlturaCm?: number;
    pacoteLarguraCm?: number;
    pacoteComprimentoCm?: number;
    pacotePesoKg?: number;
  }) {
    const nome = input.nome.trim();
    const sku = input.skuInterno.trim();
    if (nome.length < 2) throw new BadRequestException('Nome do insumo muito curto.');
    if (!sku) throw new BadRequestException('SKU interno é obrigatório.');
    if (!Number.isFinite(input.quantidade) || input.quantidade <= 0) {
      throw new BadRequestException('Quantidade base deve ser maior que zero.');
    }
    const acc = await this.prisma.platformAccount.findFirst({
      where: { id: input.supplierAccountId, role: 'SUPPLIER', status: 'ACTIVE' },
    });
    if (!acc) throw new NotFoundException('Fornecedor não encontrado ou cadastro não ativo.');
    const id = `supply-${randomUUID().slice(0, 12)}`;
    const row = await this.prisma.supplyItem.create({
      data: {
        id,
        supplierAccountId: input.supplierAccountId,
        nome,
        skuInterno: sku,
        unidade: this.unidadeFromKind(input.quantidadeKind),
        quantidadeKind: input.quantidadeKind,
        quantidade: input.quantidade,
        custoFornecedor: null,
        freteAteExecutor: null,
        observacao: input.observacao?.trim() || null,
        imagemUrl: null,
        ativo: true,
        pacoteAlturaCm: input.pacoteAlturaCm ?? 14,
        pacoteLarguraCm: input.pacoteLarguraCm ?? 12,
        pacoteComprimentoCm: input.pacoteComprimentoCm ?? 5,
        pacotePesoKg: input.pacotePesoKg ?? 0.4,
      },
    });
    return this.toListRow(row, acc.email);
  }
}
