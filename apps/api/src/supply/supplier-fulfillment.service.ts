import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

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
    }[] = [];

    for (const line of linhas) {
      const item = await this.prisma.supplyItem.findUnique({
        where: { id: line.supplyItemId },
      });
      if (!item) continue;
      rows.push({
        id: `fulf-${randomUUID().slice(0, 12)}`,
        productionAssignmentId: assignmentId,
        supplyItemId: item.id,
        supplierAccountId: item.supplierAccountId,
        compositeProductId: product.id,
        productNome: product.nome,
        quantidadePorPeca: line.quantidade,
        executorNome: assignment.executorNome,
        executorEmail: assignment.executorEmail,
        executorCep: profile?.cep ?? assignment.cepOrigem,
        executorCidade: profile?.city ?? assignment.cidadeOrigem.split('—')[0]?.trim() ?? assignment.cidadeOrigem,
        executorEndereco,
      });
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
      insumo: {
        nome: r.supplyItem.nome,
        sku_interno: r.supplyItem.skuInterno,
        quantidade_kind: r.supplyItem.quantidadeKind,
        quantidade: r.supplyItem.quantidade,
        imagem_url: r.supplyItem.imagemUrl,
      },
    }));
  }
}
