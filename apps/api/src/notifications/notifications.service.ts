import { Injectable, Logger } from '@nestjs/common';
import { quantidadeFromCompositeLineJson, supplyItemIdFromCompositeLineJson } from '../commerce/composite-line-json.util';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

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
    const linhasRaw = Array.isArray(product.linhas) ? product.linhas : [];
    const linesWithSupply: {
      quantidade: number;
      unidade: string;
      nome: string;
      sku: string;
      supplierEmail: string;
    }[] = [];

    for (const raw of linhasRaw) {
      const supplyId = supplyItemIdFromCompositeLineJson(raw);
      const q = quantidadeFromCompositeLineJson(raw);
      if (!supplyId || q == null) continue;
      const item = await this.prisma.supplyItem.findUnique({
        where: { id: supplyId },
        include: { supplier: { select: { email: true } } },
      });
      if (!item) {
        this.logger.warn(`Insumo ${supplyId} não encontrado no catálogo (e-mail não enviado para esta linha).`);
        continue;
      }
      linesWithSupply.push({
        quantidade: q,
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

  /** Cadastro de parceiro aprovado — avisa o próprio usuário. */
  async onPlatformAccountApproved(input: { email: string; name: string; role: string }): Promise<void> {
    const base = this.baseUrl();
    const painel =
      input.role === 'SUPPLIER'
        ? `${base}/painel/fornecedor`
        : input.role === 'EXECUTOR'
          ? `${base}/painel/executor`
          : `${base}/painel`;
    const papel =
      input.role === 'SUPPLIER' ? 'Fornecedor' : input.role === 'EXECUTOR' ? 'Costureira' : input.role;
    const subject = `Cadastro aprovado — ${papel}`;
    const text =
      `Olá, ${input.name},\n\n` +
      `Seu cadastro como ${papel} na plataforma foi aprovado. Já pode aceder ao painel completo.\n\n` +
      `Entrar: ${base}/entrar\n` +
      `Painel: ${painel}\n`;
    try {
      await this.mail.send({ to: input.email, subject, text });
    } catch (e) {
      this.logger.error(`Falha ao e-mail aprovado ${input.email}`, e);
    }
  }

  /** Cadastro de parceiro recusado — avisa o próprio usuário. */
  async onPlatformAccountRejected(input: {
    email: string;
    name: string;
    role: string;
    reason: string;
  }): Promise<void> {
    const base = this.baseUrl();
    const papel =
      input.role === 'SUPPLIER' ? 'Fornecedor' : input.role === 'EXECUTOR' ? 'Costureira' : input.role;
    const subject = `Cadastro não aprovado — ${papel}`;
    const text =
      `Olá, ${input.name},\n\n` +
      `Seu cadastro como ${papel} não foi aprovado neste momento.\n\n` +
      `Motivo: ${input.reason}\n\n` +
      `Em caso de dúvida, responda a este e-mail ou contacte o suporte da loja.\n\n` +
      `Página inicial: ${base}/\n`;
    try {
      await this.mail.send({ to: input.email, subject, text });
    } catch (e) {
      this.logger.error(`Falha ao e-mail recusa cadastro ${input.email}`, e);
    }
  }

  /** Fornecedor/costureira: confirmação de que o cadastro foi recebido e está em análise. */
  async onPendingPartnerRegistrationAck(input: {
    email: string;
    name: string;
    role: 'SUPPLIER' | 'EXECUTOR';
  }): Promise<void> {
    const base = this.baseUrl();
    const papel =
      input.role === 'SUPPLIER' ? 'fornecedor' : input.role === 'EXECUTOR' ? 'costureira (executor)' : input.role;
    const subject = 'Cadastro recebido — em análise';
    const text =
      `Olá, ${input.name},\n\n` +
      `Recebemos seu cadastro como ${papel}. Nossa equipe vai analisar os dados; quando for aprovado, você receberá outro e-mail e já poderá usar o painel completo.\n\n` +
      `Enquanto isso, pode entrar com o mesmo e-mail e senha; algumas áreas podem ficar limitadas até a aprovação.\n\n` +
      `Entrar: ${base}/entrar\n`;
    try {
      await this.mail.send({ to: input.email, subject, text });
    } catch (e) {
      this.logger.error(`Falha ao e-mail cadastro pendente (parceiro) ${input.email}`, e);
    }
  }

  /** Link único para redefinir senha (expira em 1h). */
  async onPasswordResetRequested(input: { email: string; name: string; resetUrl: string }): Promise<void> {
    const base = this.baseUrl();
    const subject = 'Redefinir sua senha';
    const text =
      `Olá, ${input.name},\n\n` +
      `Recebemos um pedido para redefinir a senha da sua conta. Se foi você, use o link abaixo (válido por tempo limitado):\n\n` +
      `${input.resetUrl}\n\n` +
      `Se você não pediu, ignore este e-mail; sua senha permanece a mesma.\n\n` +
      `Entrar: ${base}/entrar\n`;
    try {
      await this.mail.send({ to: input.email, subject, text });
    } catch (e) {
      this.logger.error(`Falha ao e-mail reset senha ${input.email}`, e);
    }
  }

  /** Cliente criou conta na loja (ativo imediato). */
  async onCustomerRegisteredWelcome(input: { email: string; name: string }): Promise<void> {
    const base = this.baseUrl();
    const subject = 'Bem-vindo à loja';
    const text =
      `Olá, ${input.name},\n\n` +
      `Sua conta de cliente foi criada com sucesso. Já pode entrar e comprar peças da vitrine.\n\n` +
      `Entrar: ${base}/entrar\n` +
      `Loja: ${base}/loja\n`;
    try {
      await this.mail.send({ to: input.email, subject, text });
    } catch (e) {
      this.logger.error(`Falha ao e-mail boas-vindas cliente ${input.email}`, e);
    }
  }

  /** Pedido da loja (demo ou Stripe) — cliente + resumo para admins. */
  async onStoreOrderPlaced(input: {
    channel: 'demo' | 'stripe';
    customerEmail: string;
    customerName?: string;
    lines: { productName: string; quantity: number; unitPriceBrl: number }[];
    delivery?: {
      recipientName: string;
      phone: string;
      cep: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      uf: string;
    };
    stripeSessionId?: string;
    totalBrl?: number;
  }): Promise<void> {
    const base = this.baseUrl();
    const modo = input.channel === 'stripe' ? 'Pagamento Stripe (teste ou live)' : 'Confirmação demo (sem gateway)';
    const lista = input.lines
      .map((l) => `• ${l.productName} × ${l.quantity} — ${l.unitPriceBrl.toFixed(2)} BRL / un.`)
      .join('\n');
    const total =
      typeof input.totalBrl === 'number' && Number.isFinite(input.totalBrl)
        ? input.totalBrl.toFixed(2)
        : input.lines.reduce((s, l) => s + l.quantity * l.unitPriceBrl, 0).toFixed(2);
    let entrega = '';
    if (input.delivery) {
      const d = input.delivery;
      entrega =
        `\nEntrega:\n${d.recipientName} · ${d.phone}\n` +
        `${d.street}, ${d.number}${d.complement ? ` — ${d.complement}` : ''}\n` +
        `${d.neighborhood} — ${d.city}/${d.uf} · CEP ${d.cep}\n`;
    }
    const subject =
      input.channel === 'stripe'
        ? `Compra confirmada (Stripe)${input.stripeSessionId ? ` · ${input.stripeSessionId.slice(0, 24)}...` : ''}`
        : 'Pedido confirmado (demo)';
    const textCliente =
      `Olá${input.customerName ? `, ${input.customerName}` : ''},\n\n` +
      `Recebemos o seu pedido na loja (${modo}).\n\n` +
      `Itens:\n${lista}\n\n` +
      `Total aproximado: R$ ${total}\n` +
      entrega +
      (input.stripeSessionId ? `\nReferência: ${input.stripeSessionId}\n` : '') +
      `\nLoja: ${base}/loja\n`;

    try {
      await this.mail.send({ to: input.customerEmail, subject, text: textCliente });
    } catch (e) {
      this.logger.error(`Falha ao e-mail cliente pedido ${input.customerEmail}`, e);
    }

    const admins = await this.adminEmails();
    if (admins.length === 0) return;
    const textAdmin =
      `Novo pedido na loja (${modo}).\n\n` +
      `Cliente: ${input.customerEmail}${input.customerName ? ` (${input.customerName})` : ''}\n\n` +
      `Itens:\n${lista}\n\n` +
      `Total: R$ ${total}\n` +
      entrega +
      (input.stripeSessionId ? `\nStripe session: ${input.stripeSessionId}\n` : '') +
      `\nPainel: ${base}/painel/admin\n`;

    try {
      await this.mail.send({ to: admins, subject: `[Admin] ${subject}`, text: textAdmin });
    } catch (e) {
      this.logger.error('Falha ao e-mail admins (pedido loja)', e);
    }
  }

  fireAndForgetAccountApproved(input: Parameters<NotificationsService['onPlatformAccountApproved']>[0]): void {
    void this.onPlatformAccountApproved(input).catch((err) =>
      this.logger.error('onPlatformAccountApproved', err),
    );
  }

  fireAndForgetAccountRejected(input: Parameters<NotificationsService['onPlatformAccountRejected']>[0]): void {
    void this.onPlatformAccountRejected(input).catch((err) =>
      this.logger.error('onPlatformAccountRejected', err),
    );
  }

  fireAndForgetStoreOrder(input: Parameters<NotificationsService['onStoreOrderPlaced']>[0]): void {
    void this.onStoreOrderPlaced(input).catch((err) => this.logger.error('onStoreOrderPlaced', err));
  }

  fireAndForgetCustomerWelcome(input: Parameters<NotificationsService['onCustomerRegisteredWelcome']>[0]): void {
    void this.onCustomerRegisteredWelcome(input).catch((err) =>
      this.logger.error('onCustomerRegisteredWelcome', err),
    );
  }

  fireAndForgetPendingPartnerAck(
    input: Parameters<NotificationsService['onPendingPartnerRegistrationAck']>[0],
  ): void {
    void this.onPendingPartnerRegistrationAck(input).catch((err) =>
      this.logger.error('onPendingPartnerRegistrationAck', err),
    );
  }

  fireAndForgetPasswordResetRequested(
    input: Parameters<NotificationsService['onPasswordResetRequested']>[0],
  ): void {
    void this.onPasswordResetRequested(input).catch((err) =>
      this.logger.error('onPasswordResetRequested', err),
    );
  }
}
