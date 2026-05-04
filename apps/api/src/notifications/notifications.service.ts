import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

type CompositeLine = {
  supplyItemId: string;
  quantidade: number;
  snapshot_custo_unitario: number;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private baseUrl(): string {
    const raw = process.env.FRONTEND_URL?.split(',')[0]?.trim();
    return raw || 'http://localhost:3000';
  }

  private async adminEmails(): Promise<string[]> {
    const rows = await this.prisma.platformAccount.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { email: true },
    });
    const extra = (process.env.ADMIN_NOTIFY_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const set = new Set<string>();
    for (const r of rows) set.add(r.email.toLowerCase());
    for (const e of extra) set.add(e);
    return [...set];
  }

  /** Nova atribuição: executor, fornecedores (lista de insumos → endereço da costureira) e admin. */
  async onProductionAssignmentCreated(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.productionAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) return;
    const product = await this.prisma.compositeProduct.findUnique({
      where: { id: assignment.compositeProductId },
    });
    if (!product) return;

    const base = this.baseUrl();
    const linhas = (product.linhas as unknown as CompositeLine[]) ?? [];
    const linesWithSupply: {
      quantidade: number;
      unidade: string;
      nome: string;
      sku: string;
      supplierEmail: string;
    }[] = [];

    for (const line of linhas) {
      const item = await this.prisma.supplyItem.findUnique({
        where: { id: line.supplyItemId },
        include: { supplier: { select: { email: true } } },
      });
      if (!item) {
        this.logger.warn(`Insumo ${line.supplyItemId} não encontrado no catálogo (e-mail não enviado para esta linha).`);
        continue;
      }
      linesWithSupply.push({
        quantidade: line.quantidade,
        unidade: item.unidade,
        nome: item.nome,
        sku: item.skuInterno,
        supplierEmail: item.supplier.email.toLowerCase(),
      });
    }

    const destino = `${assignment.cidadeOrigem} — CEP ${assignment.cepOrigem}`;
    const produtoBloco = `${product.nome} (SKU ${product.sku})`;

    const executorSubject = `Nova atribuição: ${product.nome}`;
    const executorText =
      `Olá, ${assignment.executorNome},\n\n` +
      `Você recebeu uma nova atribuição de produção na plataforma.\n\n` +
      `Peça: ${produtoBloco}\n` +
      `Origem combinada para envio/retirada: ${destino}\n` +
      `Estado na plataforma: ${assignment.status}\n\n` +
      `Os fornecedores de insumos foram avisados para enviar os materiais para este endereço, conforme a lista da peça.\n\n` +
      `Painel: ${base}/painel/executor\n`;

    try {
      await this.mail.send({
        to: assignment.executorEmail,
        subject: executorSubject,
        text: executorText,
      });
    } catch (e) {
      this.logger.error(`Falha ao e-mail executor ${assignment.executorEmail}`, e);
    }

    const bySupplier = new Map<string, typeof linesWithSupply>();
    for (const row of linesWithSupply) {
      const cur = bySupplier.get(row.supplierEmail) ?? [];
      cur.push(row);
      bySupplier.set(row.supplierEmail, cur);
    }

    for (const [supplierEmail, rows] of bySupplier) {
      const lista = rows
        .map((r) => `• ${r.nome} (SKU ${r.sku}): ${r.quantidade} ${r.unidade} por unidade de peça pronta`)
        .join('\n');
      const supplierSubject = `Envio de insumos — ${product.nome}`;
      const supplierText =
        `Olá,\n\n` +
        `Uma nova combinação de produção usa insumos seu(s). Envie os materiais abaixo para a costureira que fará a montagem.\n\n` +
        `Peça: ${produtoBloco}\n` +
        `Costureira: ${assignment.executorNome} (${assignment.executorEmail})\n` +
        `Endereço de envio dos insumos: ${destino}\n\n` +
        `Lista (quantidades por 1 unidade da peça terminada):\n${lista}\n\n` +
        `Organize o envio o quanto antes para não atrasar a produção. Em dúvida, fale com o administrador da loja.\n\n` +
        `Painel: ${base}/painel/fornecedor\n`;

      try {
        await this.mail.send({ to: supplierEmail, subject: supplierSubject, text: supplierText });
      } catch (e) {
        this.logger.error(`Falha ao e-mail fornecedor ${supplierEmail}`, e);
      }
    }

    const admins = await this.adminEmails();
    if (admins.length === 0) {
      this.logger.warn('Nenhum e-mail de admin ativo para notificar sobre nova atribuição.');
      return;
    }
    const fornecedorResumo = [...bySupplier.entries()]
      .map(([email, r]) => `${email}:\n${r.map((x) => `  - ${x.nome} (${x.quantidade} ${x.unidade})`).join('\n')}`)
      .join('\n\n');
    const adminSubject = `Nova atribuição — ${product.nome}`;
    const adminText =
      `Resumo operacional\n\n` +
      `Nova atribuição de produção criada.\n\n` +
      `Peça: ${produtoBloco}\n` +
      `Costureira: ${assignment.executorNome} (${assignment.executorEmail})\n` +
      `Endereço (origem): ${destino}\n\n` +
      `Fornecedores e insumos envolvidos:\n${fornecedorResumo || '(nenhum insumo resolvido no banco — confira IDs na peça)'}\n\n` +
      `Painel — pedidos: ${base}/painel/admin/pedidos\n` +
      `Painel — combinações: ${base}/painel/admin/combinacoes\n` +
      `Painel — cadastros: ${base}/painel/admin/cadastros\n`;

    try {
      await this.mail.send({ to: admins, subject: adminSubject, text: adminText });
    } catch (e) {
      this.logger.error('Falha ao e-mail admins (nova atribuição)', e);
    }
  }

  /** Novo pedido de execução aguardando resposta do admin. */
  async onNewPendingExecutionRequest(input: {
    id: string;
    executorEmail: string;
    executorNome: string;
    productNome: string;
    productSku: string;
  }): Promise<void> {
    const admins = await this.adminEmails();
    if (admins.length === 0) return;
    const base = this.baseUrl();
    const subject = `Pedido de costureira pendente — ${input.productNome}`;
    const text =
      `Uma costureira pediu para executar uma peça e aguarda sua resposta no painel.\n\n` +
      `Peça: ${input.productNome} (${input.productSku})\n` +
      `Costureira: ${input.executorNome} (${input.executorEmail})\n` +
      `Id do pedido: ${input.id}\n\n` +
      `Abra: ${base}/painel/admin/pedidos\n`;
    try {
      await this.mail.send({ to: admins, subject, text });
    } catch (e) {
      this.logger.error('Falha ao e-mail admins (pedido pendente)', e);
    }
  }

  /** Novo cadastro de fornecedor ou executor aguardando moderação. */
  async onNewPendingPlatformAccount(input: {
    email: string;
    name: string;
    role: string;
  }): Promise<void> {
    const admins = await this.adminEmails();
    if (admins.length === 0) return;
    const base = this.baseUrl();
    const papel = input.role === 'SUPPLIER' ? 'Fornecedor' : input.role === 'EXECUTOR' ? 'Costureira (executor)' : input.role;
    const subject = `Novo cadastro pendente — ${papel}`;
    const text =
      `${input.name} (${input.email}) se cadastrou como ${papel} e aguarda aprovação.\n\n` +
      `Painel: ${base}/painel/admin/cadastros\n`;
    try {
      await this.mail.send({ to: admins, subject, text });
    } catch (e) {
      this.logger.error('Falha ao e-mail admins (cadastro pendente)', e);
    }
  }

  /** Pedido de execução recusado — avisa a costureira. */
  async onExecutionRequestRejected(req: {
    executorEmail: string;
    executorNome: string;
    productNome: string;
    reason: string;
  }): Promise<void> {
    const base = this.baseUrl();
    const subject = `Pedido de produção não aprovado — ${req.productNome}`;
    const text =
      `Olá, ${req.executorNome},\n\n` +
      `Seu pedido para executar a peça "${req.productNome}" não foi aprovado.\n\n` +
      `Motivo informado: ${req.reason}\n\n` +
      `Painel: ${base}/painel/executor\n`;
    try {
      await this.mail.send({ to: req.executorEmail, subject, text });
    } catch (e) {
      this.logger.error(`Falha ao e-mail executor (recusa) ${req.executorEmail}`, e);
    }
  }

  fireAndForgetAssignment(assignmentId: string): void {
    void this.onProductionAssignmentCreated(assignmentId).catch((err) =>
      this.logger.error('onProductionAssignmentCreated', err),
    );
  }

  fireAndForgetPendingRequest(input: Parameters<NotificationsService['onNewPendingExecutionRequest']>[0]): void {
    void this.onNewPendingExecutionRequest(input).catch((err) =>
      this.logger.error('onNewPendingExecutionRequest', err),
    );
  }

  fireAndForgetPendingAccount(input: Parameters<NotificationsService['onNewPendingPlatformAccount']>[0]): void {
    void this.onNewPendingPlatformAccount(input).catch((err) =>
      this.logger.error('onNewPendingPlatformAccount', err),
    );
  }

  fireAndForgetRejectedRequest(input: Parameters<NotificationsService['onExecutionRequestRejected']>[0]): void {
    void this.onExecutionRequestRejected(input).catch((err) =>
      this.logger.error('onExecutionRequestRejected', err),
    );
  }
}
