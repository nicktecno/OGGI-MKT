import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, type CompositeProduct, type ProductionAssignment, type SupplyItem } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  quantidadeFromCompositeLineJson,
  snapshotCustoFromCompositeLineJson,
  supplyItemIdFromCompositeLineJson,
} from '../commerce/composite-line-json.util';
import { MelhorEnvioService } from '../melhor-envio/melhor-envio.service';
import { PrismaService } from '../prisma/prisma.service';
import { pickShipmentPackFromSupplies, stubFreteB2B } from './package-shipping.util';

type CompositeLine = {
  supplyItemId: string;
  quantidade: number;
  snapshot_custo_unitario: number;
};

type ExecutorAccWithProfile = Prisma.PlatformAccountGetPayload<{
  include: { executorProfile: true };
}>;

type PendingLine = { line: CompositeLine; item: SupplyItem };

@Injectable()
export class SupplierFulfillmentService {
  private readonly log = new Logger(SupplierFulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly melhorEnvio: MelhorEnvioService,
  ) {}

  /**
   * Recria linhas de entrega quando uma atribuição produto+executor nasce (ou re-sincroniza).
   * Devolve a soma dos fretes B2B (um valor por fornecedor, pacote de maior volume entre os insumos dele).
   * Cada frete usa cotação Melhor Envio (`shipment/calculate`) quando há credenciais e CEPs válidos; senão, estimativa local (`stubFreteB2B`).
   */
  async syncFromAssignment(assignmentId: string): Promise<{ freteTotal: number }> {
    const assignment = await this.prisma.productionAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      this.log.warn(`syncFromAssignment: assignment ${assignmentId} não encontrada`);
      return { freteTotal: 0 };
    }
    if (assignment.status === 'ARCHIVED') {
      await this.deleteForAssignment(assignmentId);
      return { freteTotal: 0 };
    }

    const product = await this.prisma.compositeProduct.findUnique({
      where: { id: assignment.compositeProductId },
    });
    if (!product) return { freteTotal: 0 };

    const executorAcc = await this.prisma.platformAccount.findFirst({
      where: { email: assignment.executorEmail.trim().toLowerCase() },
      include: { executorProfile: true },
    });
    const profile = executorAcc?.executorProfile;
    const executorEndereco = profile?.addressLine1?.trim()
      ? [profile.addressLine1, profile.addressComplement].filter(Boolean).join(', ')
      : '— (complete o endereço no perfil da costureira)';

    const linhasRaw = Array.isArray(product.linhas) ? product.linhas : [];

    await this.prisma.supplierFulfillmentLine.deleteMany({
      where: { productionAssignmentId: assignmentId },
    });

    const bySupplier = new Map<string, PendingLine[]>();

    for (const rawRow of linhasRaw) {
      const sid = supplyItemIdFromCompositeLineJson(rawRow);
      const q = quantidadeFromCompositeLineJson(rawRow);
      if (!sid || q == null) {
        this.log.warn(
          `syncFromAssignment: linha de montagem ignorada (insumo ou quantidade inválidos) na peça ${product.id}`,
        );
        continue;
      }
      const line: CompositeLine = {
        supplyItemId: sid,
        quantidade: q,
        snapshot_custo_unitario: snapshotCustoFromCompositeLineJson(rawRow),
      };
      const item = await this.prisma.supplyItem.findUnique({
        where: { id: sid },
      });
      if (!item) continue;
      const supplierKey = item.supplierAccountId;
      if (!bySupplier.has(supplierKey)) bySupplier.set(supplierKey, []);
      bySupplier.get(supplierKey)!.push({ line, item });
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
      melhorEnvioPedidoId: string | null;
      melhorEnvioEtiquetaUrl: string | null;
    }[] = [];

    let freteTotal = 0;
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

      const stubFrete = stubFreteB2B({
        cepOrigem,
        cepDestino,
        alturaCm: ship.alturaCm,
        larguraCm: ship.larguraCm,
        comprimentoCm: ship.comprimentoCm,
        pesoKg: ship.pesoKg,
      });
      const meQuote = await this.quoteMelhorEnvioInsumoPack({
        assignmentId,
        supplierAccountId,
        product,
        cepOrigem,
        cepDestino,
        ship,
        pending,
      });
      const me = await this.tryPurchaseMelhorEnvioInsumoLabel({
        assignmentId,
        supplierAccountId,
        assignment,
        product,
        executorAcc,
        cepOrigem,
        cepDestino,
        ship,
        pending,
        preQuoted: meQuote ?? undefined,
      });
      const freteCotadoReais = me?.quotedPrice ?? meQuote?.price ?? stubFrete;
      freteTotal += freteCotadoReais;
      const meOrderId = me?.orderId ?? null;
      const mePrintUrl = me?.printUrl ?? null;

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
          freteCotadoReais,
          melhorEnvioPedidoId: meOrderId,
          melhorEnvioEtiquetaUrl: mePrintUrl,
        });
      }
    }

    if (rows.length) {
      await this.prisma.supplierFulfillmentLine.createMany({ data: rows });
    }
    return { freteTotal };
  }

  /**
   * Fornecedor: gera ou regera etiqueta ME para todas as linhas dele nesta atribuição
   * (mesma lógica do sync; atualiza pedido/url nas linhas existentes).
   */
  async retryMelhorEnvioForSupplierAssignment(
    productionAssignmentId: string,
    supplierAccountId: string,
  ): Promise<{ orderId: string; printUrl: string }> {
    const lineCount = await this.prisma.supplierFulfillmentLine.count({
      where: { productionAssignmentId, supplierAccountId },
    });
    if (lineCount === 0) {
      throw new NotFoundException('Nenhuma entrega sua encontrada para esta atribuição.');
    }

    const assignment = await this.prisma.productionAssignment.findUnique({
      where: { id: productionAssignmentId },
    });
    if (!assignment) {
      throw new NotFoundException('Atribuição não encontrada.');
    }
    if (assignment.status === 'ARCHIVED') {
      throw new BadRequestException('Atribuição arquivada — não é possível gerar etiqueta.');
    }

    const product = await this.prisma.compositeProduct.findUnique({
      where: { id: assignment.compositeProductId },
    });
    if (!product) {
      throw new NotFoundException('Peça (produto composto) não encontrada.');
    }

    const executorAcc = await this.prisma.platformAccount.findFirst({
      where: { email: assignment.executorEmail.trim().toLowerCase() },
      include: { executorProfile: true },
    });
    const profile = executorAcc?.executorProfile;
    const cepDestino = profile?.cep?.trim() || assignment.cepOrigem;

    const linhasRaw = Array.isArray(product.linhas) ? product.linhas : [];
    const bySupplier = new Map<string, PendingLine[]>();

    for (const rawRow of linhasRaw) {
      const sid = supplyItemIdFromCompositeLineJson(rawRow);
      const q = quantidadeFromCompositeLineJson(rawRow);
      if (!sid || q == null) continue;
      const line: CompositeLine = {
        supplyItemId: sid,
        quantidade: q,
        snapshot_custo_unitario: snapshotCustoFromCompositeLineJson(rawRow),
      };
      const item = await this.prisma.supplyItem.findUnique({
        where: { id: sid },
      });
      if (!item) continue;
      const supplierKey = item.supplierAccountId;
      if (!bySupplier.has(supplierKey)) bySupplier.set(supplierKey, []);
      bySupplier.get(supplierKey)!.push({ line, item });
    }

    const pending = bySupplier.get(supplierAccountId);
    if (!pending?.length) {
      throw new BadRequestException('Nenhum insumo seu nesta atribuição.');
    }

    const sup = await this.prisma.supplierProfile.findUnique({
      where: { accountId: supplierAccountId },
    });
    const cepOrigem = sup?.cep?.trim() || '01001000';

    const ship = pickShipmentPackFromSupplies(
      pending.map((p) => ({
        alturaCm: p.item.pacoteAlturaCm,
        larguraCm: p.item.pacoteLarguraCm,
        comprimentoCm: p.item.pacoteComprimentoCm,
        pesoKg: p.item.pacotePesoKg,
      })),
    );

    const meQuote = await this.quoteMelhorEnvioInsumoPack({
      assignmentId: productionAssignmentId,
      supplierAccountId,
      product,
      cepOrigem,
      cepDestino,
      ship,
      pending,
    });

    const me = await this.tryPurchaseMelhorEnvioInsumoLabel({
      assignmentId: productionAssignmentId,
      supplierAccountId,
      assignment,
      product,
      executorAcc,
      cepOrigem,
      cepDestino,
      ship,
      pending,
      preQuoted: meQuote ?? undefined,
    });
    if (!me) {
      throw new BadRequestException(
        'Melhor Envio não gerou etiqueta. Verifique OAuth/token na API, variáveis MELHOR_ENVIO_B2B_SUPPLIER_CNPJ e MELHOR_ENVIO_B2B_EXECUTOR_CPF, endereços completos (fornecedor e costureira), CEPs e saldo na carteira (sandbox incluído).',
      );
    }

    await this.prisma.supplierFulfillmentLine.updateMany({
      where: { productionAssignmentId, supplierAccountId },
      data: {
        melhorEnvioPedidoId: me.orderId,
        melhorEnvioEtiquetaUrl: me.printUrl,
        freteCotadoReais: me.quotedPrice,
      },
    });

    return { orderId: me.orderId, printUrl: me.printUrl };
  }

  private sanitizeMePhone(raw: string | null | undefined): string {
    const d = String(raw ?? '').replace(/\D/g, '');
    if (d.length >= 10 && d.length <= 11) return d;
    if (d.length > 11) return d.slice(0, 11);
    return '11999999999';
  }

  private inferStreetNumber(addressLine: string): string {
    const t = addressLine.trim();
    const tail = /\b(\d{1,5}[A-Za-zº°]?)\s*$/u.exec(t);
    if (tail) return tail[1].replace(/º|°/gu, '');
    const head = /^\s*(\d{1,5}[A-Za-zº°]?)\s*[-,/\s]/u.exec(t);
    if (head) return head[1].replace(/º|°/gu, '');
    return 'S/N';
  }

  /**
   * Cotação ME do pacote de insumos (não exige B2B no .env). Usada no frete exibido e, opcionalmente,
   * reutilizada na compra da etiqueta via `preQuoted` para evitar duplicar `shipment/calculate`.
   */
  private async quoteMelhorEnvioInsumoPack(params: {
    assignmentId: string;
    supplierAccountId: string;
    product: CompositeProduct;
    cepOrigem: string;
    cepDestino: string;
    ship: { alturaCm: number; larguraCm: number; comprimentoCm: number; pesoKg: number };
    pending: PendingLine[];
  }): Promise<{ price: number; serviceId: number } | null> {
    try {
      if (!(await this.melhorEnvio.hasShippingCredentials())) return null;
      const fromCep = params.cepOrigem.replace(/\D/g, '').slice(0, 8);
      const toCep = params.cepDestino.replace(/\D/g, '').slice(0, 8);
      if (fromCep.length !== 8 || toCep.length !== 8) return null;

      const products = params.pending.map(({ line, item }) => {
        const qty = line.quantidade > 0 ? line.quantidade : 1;
        const unit = Math.max(0.01, line.snapshot_custo_unitario || 0.01);
        const nome = `${item.nome} (${params.product.nome})`;
        return { name: nome.slice(0, 120), quantity: qty, unitary_value: unit };
      });
      const insuranceValueBrl = Math.max(
        1,
        products.reduce((s, p) => s + p.unitary_value * p.quantity, 0),
      );
      const productId = `ins-${params.assignmentId}-${params.supplierAccountId}`;
      return await this.melhorEnvio.quoteCheapestForProductBoxWithService({
        fromPostalCode: fromCep,
        toPostalCode: toCep,
        productId,
        widthCm: params.ship.larguraCm,
        heightCm: params.ship.alturaCm,
        lengthCm: params.ship.comprimentoCm,
        weightKg: params.ship.pesoKg,
        insuranceValueBrl,
        quantity: 1,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`ME cotação insumos ignorada (${params.supplierAccountId}): ${msg}`);
      return null;
    }
  }

  /**
   * Compra etiqueta ME fornecedor → costureira (um pedido por fornecedor no batch).
   * Falhas de API ou dados incompletos → null (sync de fulfillment continua).
   */
  private async tryPurchaseMelhorEnvioInsumoLabel(params: {
    assignmentId: string;
    supplierAccountId: string;
    assignment: ProductionAssignment;
    product: CompositeProduct;
    executorAcc: ExecutorAccWithProfile | null;
    cepOrigem: string;
    cepDestino: string;
    ship: { alturaCm: number; larguraCm: number; comprimentoCm: number; pesoKg: number };
    pending: PendingLine[];
    /** Se vier da cotação prévia no sync, evita segundo `shipment/calculate` antes do carrinho. */
    preQuoted?: { price: number; serviceId: number };
  }): Promise<{ orderId: string; printUrl: string; quotedPrice: number } | null> {
    try {
      if (!(await this.melhorEnvio.hasShippingCredentials())) return null;
      if (!this.melhorEnvio.isB2BInsumoLabelConfigured()) return null;

      const cnpj = this.melhorEnvio.getB2bSupplierCnpjDigits();
      const cpf = this.melhorEnvio.getB2bExecutorCpfDigits();
      if (cnpj.length !== 14 || cpf.length !== 11) return null;

      const ex = params.executorAcc?.executorProfile;
      if (!params.executorAcc || !ex?.addressLine1?.trim() || !ex.cep?.trim()) {
        this.log.warn('ME etiqueta insumos: costureira sem endereço/CEP no perfil');
        return null;
      }

      const supplierAcc = await this.prisma.platformAccount.findUnique({
        where: { id: params.supplierAccountId },
        include: { supplierProfile: true },
      });
      const sp = supplierAcc?.supplierProfile;
      if (!supplierAcc || !sp?.addressLine1?.trim() || !sp.cep?.trim()) {
        this.log.warn(`ME etiqueta insumos: fornecedor ${params.supplierAccountId} sem endereço completo`);
        return null;
      }

      const fromCep = params.cepOrigem.replace(/\D/g, '').slice(0, 8);
      const toCep = params.cepDestino.replace(/\D/g, '').slice(0, 8);
      if (fromCep.length !== 8 || toCep.length !== 8) {
        this.log.warn('ME etiqueta insumos: CEP origem ou destino inválido');
        return null;
      }

      const products = params.pending.map(({ line, item }) => {
        const qty = line.quantidade > 0 ? line.quantidade : 1;
        const unit = Math.max(0.01, line.snapshot_custo_unitario || 0.01);
        const nome = `${item.nome} (${params.product.nome})`;
        return { name: nome.slice(0, 120), quantity: qty, unitary_value: unit };
      });

      const insuranceValueBrl = Math.max(
        1,
        products.reduce((s, p) => s + p.unitary_value * p.quantity, 0),
      );

      const quoted = params.preQuoted
        ? params.preQuoted
        : await this.melhorEnvio.quoteCheapestForProductBoxWithService({
            fromPostalCode: fromCep,
            toPostalCode: toCep,
            productId: `ins-${params.assignmentId}-${params.supplierAccountId}`,
            widthCm: params.ship.larguraCm,
            heightCm: params.ship.alturaCm,
            lengthCm: params.ship.comprimentoCm,
            weightKg: params.ship.pesoKg,
            insuranceValueBrl,
            quantity: 1,
          });

      const fromAddr = sp.addressLine1.trim();
      const toAddr = ex.addressLine1.trim();

      const purchased = await this.melhorEnvio.purchaseSupplierInsumoShipment({
        fromPostalCode: fromCep,
        toPostalCode: toCep,
        serviceId: quoted.serviceId,
        from: {
          name: (sp.businessName || supplierAcc.name).slice(0, 120),
          email: supplierAcc.email.trim(),
          phone: this.sanitizeMePhone(sp.phone),
          address: fromAddr.slice(0, 200),
          number: this.inferStreetNumber(fromAddr).slice(0, 20),
          complement: (sp.addressComplement ?? '').slice(0, 120),
          district: 'Centro',
          city: sp.city.slice(0, 120),
          state_abbr: sp.stateUf,
          postal_code: fromCep,
          company_document: cnpj,
          state_register: 'ISENTO',
        },
        to: {
          name: (ex.displayName || params.executorAcc.name).slice(0, 120),
          email: params.executorAcc.email.trim(),
          phone: this.sanitizeMePhone(ex.phone),
          document: cpf,
          address: toAddr.slice(0, 200),
          number: this.inferStreetNumber(toAddr).slice(0, 20),
          complement: (ex.addressComplement ?? '').slice(0, 120),
          district: 'Centro',
          city: ex.city.slice(0, 120),
          state_abbr: ex.stateUf,
          postal_code: toCep,
          country_id: 'BR',
        },
        volumes: [
          {
            height: params.ship.alturaCm,
            width: params.ship.larguraCm,
            length: params.ship.comprimentoCm,
            weight: params.ship.pesoKg,
          },
        ],
        products,
        insuranceValueBrl,
        platformTag: `insumo ${params.assignmentId} fornecedor ${params.supplierAccountId}`,
      });
      return { ...purchased, quotedPrice: quoted.price };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`ME etiqueta insumos ignorada (${params.supplierAccountId}): ${msg}`);
      return null;
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
