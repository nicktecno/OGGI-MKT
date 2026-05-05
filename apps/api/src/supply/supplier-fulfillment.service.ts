import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { SupplyItem } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { PlatformJwtUser } from '../auth/platform-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { pickShipmentPackFromSupplies, stubFreteB2B } from './package-shipping.util';

type CompositeLine = {
  supplyItemId: string;
  quantidade: number;
  snapshot_custo_unitario: number;
};

@Injectable()
export class SupplierFulfillmentService {
  private readonly log = new Logger(SupplierFulfillmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Recria linhas de entrega quando uma atribuição produto+executor nasce (ou re-sincroniza). */
  async syncFromAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.productionAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      this.log.warn(`syncFromAssignment: assignment ${assignmentId} não encontrada`);
      return;
    }
    if (assignment.status === 'ARCHIVED') {
      await this.deleteForAssignment(assignmentId);
      return;
    }

    const product = await this.prisma.compositeProduct.findUnique({
      where: { id: assignment.compositeProductId },
    });
    if (!product) return;

    const executorAcc = await this.prisma.platformAccount.findFirst({
      where: { email: assignment.executorEmail.trim().toLowerCase() },
      include: { executorProfile: true },
    });
    const profile = executorAcc?.executorProfile;
    const executorEndereco = profile?.addressLine1?.trim()
      ? [profile.addressLine1, profile.addressComplement].filter(Boolean).join(', ')
      : '— (complete o endereço no perfil da costureira)';

    const linhas = (product.linhas as unknown as CompositeLine[]) ?? [];

    await this.prisma.supplierFulfillmentLine.deleteMany({
      where: { productionAssignmentId: assignmentId },
    });

    type Pending = { line: CompositeLine; item: SupplyItem };
    const bySupplier = new Map<string, Pending[]>();

    for (const line of linhas) {
      const item = await this.prisma.supplyItem.findUnique({
        where: { id: line.supplyItemId },
      });
      if (!item) continue;
      const sid = item.supplierAccountId;
      if (!bySupplier.has(sid)) bySupplier.set(sid, []);
      bySupplier.get(sid)!.push({ line, item });
    }

    const supplierCepCache = new Map<string, string>();
    const cepDestino = profile?.cep?.trim() || assignment.cepOrigem;

    const rows: {
      id: string;
      productionAssignmentId: string;
      supplyItemId: string;
      supplierAccountId: string;
      compositeProductId: string;
      productNome: string;
      quantidadePorPeca: number;
      executorNome: string;
      executorEmail: string;
      executorCep: string;
      executorCidade: string;
      executorEndereco: string;
      envioPacoteAlturaCm: number;
      envioPacoteLarguraCm: number;
      envioPacoteComprimentoCm: number;
      envioPacotePesoKg: number;
      freteCotadoReais: number;
    }[] = [];

    for (const [supplierAccountId, pending] of bySupplier) {
      const ship = pickShipmentPackFromSupplies(
        pending.map((p) => ({
          alturaCm: p.item.pacoteAlturaCm,
          larguraCm: p.item.pacoteLarguraCm,
          comprimentoCm: p.item.pacoteComprimentoCm,
          pesoKg: p.item.pacotePesoKg,
        })),
      );

      let cepOrigem = supplierCepCache.get(supplierAccountId);
      if (cepOrigem === undefined) {
        const sup = await this.prisma.supplierProfile.findUnique({
          where: { accountId: supplierAccountId },
        });
        cepOrigem = sup?.cep?.trim() || '01001000';
        supplierCepCache.set(supplierAccountId, cepOrigem);
      }

      const frete = stubFreteB2B({
        cepOrigem,
        cepDestino,
        alturaCm: ship.alturaCm,
        larguraCm: ship.larguraCm,
        comprimentoCm: ship.comprimentoCm,
        pesoKg: ship.pesoKg,
      });

      for (const { line } of pending) {
        rows.push({
          id: `fulf-${randomUUID().slice(0, 12)}`,
          productionAssignmentId: assignmentId,
          supplyItemId: line.supplyItemId,
          supplierAccountId,
          compositeProductId: product.id,
          productNome: product.nome,
          quantidadePorPeca: line.quantidade,
          executorNome: assignment.executorNome,
          executorEmail: assignment.executorEmail,
          executorCep: profile?.cep ?? assignment.cepOrigem,
          executorCidade: profile?.city ?? assignment.cidadeOrigem.split('—')[0]?.trim() ?? assignment.cidadeOrigem,
          executorEndereco,
          envioPacoteAlturaCm: ship.alturaCm,
          envioPacoteLarguraCm: ship.larguraCm,
          envioPacoteComprimentoCm: ship.comprimentoCm,
          envioPacotePesoKg: ship.pesoKg,
          freteCotadoReais: frete,
        });
      }
    }

    if (rows.length) {
      await this.prisma.supplierFulfillmentLine.createMany({ data: rows });
    }
  }

  async deleteForAssignment(assignmentId: string): Promise<void> {
    await this.prisma.supplierFulfillmentLine.deleteMany({
      where: { productionAssignmentId: assignmentId },
    });
  }

  /**
   * Fornecedor ajusta o pacote do envio ao executor (mesmo para todos os insumos daquela atribuição)
   * e recalcula o frete (stub até Melhor Envio).
   */
  async recalculateFreteForAssignment(
    user: PlatformJwtUser,
    productionAssignmentId: string,
    dims: {
      alturaCm: number;
      larguraCm: number;
      comprimentoCm: number;
      pesoKg: number;
    },
  ) {
    if (user.role !== 'SUPPLIER') {
      throw new ForbiddenException('Apenas fornecedores podem recalcular este frete.');
    }
    const { alturaCm, larguraCm, comprimentoCm, pesoKg } = dims;
    if (
      !Number.isFinite(alturaCm) ||
      !Number.isFinite(larguraCm) ||
      !Number.isFinite(comprimentoCm) ||
      !Number.isFinite(pesoKg) ||
      alturaCm < 0.1 ||
      larguraCm < 0.1 ||
      comprimentoCm < 0.1 ||
      pesoKg < 0.01
    ) {
      throw new BadRequestException('Use dimensões (cm) ≥ 0,1 e peso (kg) ≥ 0,01.');
    }

    const lines = await this.prisma.supplierFulfillmentLine.findMany({
      where: {
        productionAssignmentId,
        supplierAccountId: user.sub,
      },
    });
    if (lines.length === 0) {
      throw new NotFoundException('Nenhuma entrega encontrada para esta atribuição.');
    }

    const first = lines[0];
    const sup = await this.prisma.supplierProfile.findUnique({
      where: { accountId: user.sub },
    });
    const cepOrigem = sup?.cep?.trim() || '01001000';
    const frete = stubFreteB2B({
      cepOrigem,
      cepDestino: first.executorCep,
      alturaCm,
      larguraCm,
      comprimentoCm,
      pesoKg,
    });

    await this.prisma.supplierFulfillmentLine.updateMany({
      where: {
        productionAssignmentId,
        supplierAccountId: user.sub,
      },
      data: {
        envioPacoteAlturaCm: alturaCm,
        envioPacoteLarguraCm: larguraCm,
        envioPacoteComprimentoCm: comprimentoCm,
        envioPacotePesoKg: pesoKg,
        freteCotadoReais: frete,
      },
    });

    return this.listForSupplier(user.sub);
  }

  async listForSupplier(supplierAccountId: string) {
    const lines = await this.prisma.supplierFulfillmentLine.findMany({
      where: { supplierAccountId },
      include: {
        supplyItem: {
          select: {
            id: true,
            nome: true,
            skuInterno: true,
            quantidadeKind: true,
            quantidade: true,
            imagemUrl: true,
            pacoteAlturaCm: true,
            pacoteLarguraCm: true,
            pacoteComprimentoCm: true,
            pacotePesoKg: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return lines.map((r) => ({
      id: r.id,
      production_assignment_id: r.productionAssignmentId,
      supply_item_id: r.supplyItemId,
      composite_product_id: r.compositeProductId,
      product_nome: r.productNome,
      quantidade_por_peca: r.quantidadePorPeca,
      executor_nome: r.executorNome,
      executor_email: r.executorEmail,
      executor_cep: r.executorCep,
      executor_cidade: r.executorCidade,
      executor_endereco: r.executorEndereco,
      melhor_envio_etiqueta_url: r.melhorEnvioEtiquetaUrl,
      melhor_envio_pedido_id: r.melhorEnvioPedidoId,
      envio_pacote_altura_cm: r.envioPacoteAlturaCm,
      envio_pacote_largura_cm: r.envioPacoteLarguraCm,
      envio_pacote_comprimento_cm: r.envioPacoteComprimentoCm,
      envio_pacote_peso_kg: r.envioPacotePesoKg,
      frete_cotado_reais: r.freteCotadoReais,
      insumo: {
        nome: r.supplyItem.nome,
        sku_interno: r.supplyItem.skuInterno,
        quantidade_kind: r.supplyItem.quantidadeKind,
        quantidade: r.supplyItem.quantidade,
        imagem_url: r.supplyItem.imagemUrl,
        pacote_altura_cm: r.supplyItem.pacoteAlturaCm,
        pacote_largura_cm: r.supplyItem.pacoteLarguraCm,
        pacote_comprimento_cm: r.supplyItem.pacoteComprimentoCm,
        pacote_peso_kg: r.supplyItem.pacotePesoKg,
      },
    }));
  }
}
