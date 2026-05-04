import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { PlatformJwtUser } from '../auth/platform-jwt.guard';
import type { CreateSupplyItemDto } from './dto/create-supply-item.dto';
import type { UpdateSupplyItemDto } from './dto/update-supply-item.dto';

@Injectable()
export class SupplyService {
  constructor(private readonly prisma: PrismaService) {}

  private assertSupplier(user: PlatformJwtUser) {
    if (user.role !== 'SUPPLIER') {
      throw new ForbiddenException('Apenas fornecedores gerenciam insumos.');
    }
    if (user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenException('Cadastro ainda não aprovado.');
    }
  }

  async listForUser(user: PlatformJwtUser) {
    this.assertSupplier(user);
    const rows = await this.prisma.supplyItem.findMany({
      where: { supplierAccountId: user.sub },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      supplierEmail: user.email,
      nome: r.nome,
      sku_interno: r.skuInterno,
      unidade: r.unidade,
      custo_fornecedor: r.custoFornecedor,
      frete_ate_executor: r.freteAteExecutor,
      ativo: r.ativo,
    }));
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
        unidade: dto.unidade.trim(),
        custoFornecedor: dto.custoFornecedor,
        freteAteExecutor: dto.freteAteExecutor,
        ativo: dto.ativo ?? true,
      },
    });
    return {
      id: row.id,
      supplierEmail: user.email,
      nome: row.nome,
      sku_interno: row.skuInterno,
      unidade: row.unidade,
      custo_fornecedor: row.custoFornecedor,
      frete_ate_executor: row.freteAteExecutor,
      ativo: row.ativo,
    };
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
        ...(dto.unidade !== undefined ? { unidade: dto.unidade.trim() } : {}),
        ...(dto.custoFornecedor !== undefined ? { custoFornecedor: dto.custoFornecedor } : {}),
        ...(dto.freteAteExecutor !== undefined ? { freteAteExecutor: dto.freteAteExecutor } : {}),
        ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
      },
    });
    return {
      id: updated.id,
      supplierEmail: user.email,
      nome: updated.nome,
      sku_interno: updated.skuInterno,
      unidade: updated.unidade,
      custo_fornecedor: updated.custoFornecedor,
      frete_ate_executor: updated.freteAteExecutor,
      ativo: updated.ativo,
    };
  }
}
