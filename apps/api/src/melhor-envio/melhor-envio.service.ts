import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MeFiscalParty } from '../platform/fiscal-document.util';
import { PrismaService } from '../prisma/prisma.service';

/** Resposta documentada em https://docs.melhorenvio.com.br/reference/solicitacao-do-token */
type TokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

const OAUTH_ROW_ID = 'default';

@Injectable()
export class MelhorEnvioService {
  private readonly log = new Logger(MelhorEnvioService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getApiBase(): string {
    const raw =
      this.config.get<string>('MELHOR_ENVIO_API_BASE')?.trim() || 'https://sandbox.melhorenvio.com.br';
    return raw.replace(/\/$/, '');
  }

  /** Deve coincidir com o campo cadastrado no app (Área Dev). */
  getRedirectUri(): string {
    const explicit = this.config.get<string>('MELHOR_ENVIO_REDIRECT_URI')?.trim();
    if (explicit) return explicit.replace(/\/$/, '');
    const apiPublic = this.config.get<string>('API_PUBLIC_URL')?.trim();
    if (apiPublic) {
      return `${apiPublic.replace(/\/$/, '')}/oauth/melhor-envio/callback`;
    }
    throw new ServiceUnavailableException(
      'Defina MELHOR_ENVIO_REDIRECT_URI (URL completa do callback) ou API_PUBLIC_URL na API.',
    );
  }

  getClientId(): string {
    const id = this.config.get<string>('MELHOR_ENVIO_CLIENT_ID')?.trim();
    if (!id) {
      throw new ServiceUnavailableException('MELHOR_ENVIO_CLIENT_ID não configurado.');
    }
    return id;
  }

  getClientSecret(): string {
    const s = this.config.get<string>('MELHOR_ENVIO_CLIENT_SECRET')?.trim();
    if (!s) {
      throw new ServiceUnavailableException('MELHOR_ENVIO_CLIENT_SECRET não configurado.');
    }
    return s;
  }

  getUserAgent(): string {
    return (
      this.config.get<string>('MELHOR_ENVIO_USER_AGENT')?.trim() ||
      'AgregadorServicos (integracoes@exemplo.com.br)'
    );
  }

  /** Permissões separadas por espaço — ajuste no .env se precisar de menos. */
  getDefaultScopes(): string {
    return (
      this.config.get<string>('MELHOR_ENVIO_SCOPE')?.trim() ||
      'shipping-calculate shipping-generate shipping-checkout shipping-preview orders-read shipping-tracking users-read'
    );
  }

  buildAuthorizationUrl(state: string = 'admin'): string {
    const base = this.getApiBase();
    const clientId = this.getClientId();
    const redirectUri = this.getRedirectUri();
    const scope = this.getDefaultScopes();
    const q = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope,
    });
    return `${base}/oauth/authorize?${q.toString()}`;
  }

  /**
   * Troca o `code` do callback por access_token + refresh_token.
   */
  async exchangeAuthorizationCode(code: string): Promise<TokenResponse> {
    const base = this.getApiBase();
    const url = `${base}/oauth/token`;
    const body = {
      grant_type: 'authorization_code',
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      redirect_uri: this.getRedirectUri(),
      code: code.trim(),
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': this.getUserAgent(),
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      this.log.warn(`ME token exchange falhou: ${res.status} ${text.slice(0, 500)}`);
      throw new Error(`Melhor Envio recusou o token (${res.status}).`);
    }
    try {
      return JSON.parse(text) as TokenResponse;
    } catch {
      throw new Error('Resposta de token inválida da Melhor Envio.');
    }
  }

  async persistOAuthTokens(tokens: TokenResponse): Promise<void> {
    const expiresAt = new Date(Date.now() + Math.max(60, tokens.expires_in) * 1000);
    await this.prisma.melhorEnvioOAuthToken.upsert({
      where: { id: OAUTH_ROW_ID },
      create: {
        id: OAUTH_ROW_ID,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
    });
    this.logTokenReceived(tokens);
  }

  /** Token fixo no .env (CI) ou OAuth gravado no Postgres. */
  async hasShippingCredentials(): Promise<boolean> {
    if (this.config.get<string>('MELHOR_ENVIO_ACCESS_TOKEN')?.trim()) {
      return true;
    }
    const row = await this.prisma.melhorEnvioOAuthToken.findUnique({
      where: { id: OAUTH_ROW_ID },
    });
    return !!row;
  }

  private parsePriceBrl(raw: unknown): number | null {
    if (typeof raw !== 'string') return null;
    const n = Number.parseFloat(raw.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  private async refreshOAuthToken(refreshToken: string): Promise<TokenResponse> {
    const base = this.getApiBase();
    const url = `${base}/oauth/token`;
    const body = {
      grant_type: 'refresh_token',
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      refresh_token: refreshToken.trim(),
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': this.getUserAgent(),
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      this.log.warn(`ME refresh token falhou: ${res.status} ${text.slice(0, 400)}`);
      throw new ServiceUnavailableException('Melhor Envio: sessão expirada. Autorize de novo no painel admin.');
    }
    try {
      return JSON.parse(text) as TokenResponse;
    } catch {
      throw new ServiceUnavailableException('Melhor Envio: resposta inválida ao renovar token.');
    }
  }

  private async getBearerTokenForShipping(): Promise<string> {
    const envTok = this.config.get<string>('MELHOR_ENVIO_ACCESS_TOKEN')?.trim();
    if (envTok) {
      return envTok;
    }
    let row = await this.prisma.melhorEnvioOAuthToken.findUnique({
      where: { id: OAUTH_ROW_ID },
    });
    if (!row) {
      throw new ServiceUnavailableException(
        'Melhor Envio não autorizado: defina MELHOR_ENVIO_ACCESS_TOKEN ou conclua o OAuth em GET /integrations/melhor-envio/start (admin).',
      );
    }
    const bufferMs = 120_000;
    if (row.expiresAt.getTime() <= Date.now() + bufferMs) {
      const tokens = await this.refreshOAuthToken(row.refreshToken);
      await this.persistOAuthTokens(tokens);
      row = await this.prisma.melhorEnvioOAuthToken.findUniqueOrThrow({
        where: { id: OAUTH_ROW_ID },
      });
    }
    return row.accessToken;
  }

  /** Extrai mensagem legível do corpo de erro da API Melhor Envio. */
  private formatMeApiError(status: number, json: unknown | null, text: string): string {
    if (status === 401) {
      const base = this.getApiBase();
      const envTok = this.config.get<string>('MELHOR_ENVIO_ACCESS_TOKEN')?.trim();
      if (envTok) {
        return `Melhor Envio recusou MELHOR_ENVIO_ACCESS_TOKEN (401). Remova essa variável no Render e use OAuth em ${base}/integrations/melhor-envio/start, ou cole um token gerado no app de produção (${base}).`;
      }
      return `Melhor Envio recusou o token OAuth (401). O token no banco foi emitido em outro ambiente ou expirou. Com MELHOR_ENVIO_API_BASE=${base}, abra ${base}/integrations/melhor-envio/start e autorize de novo (app Melhor Envio de produção).`;
    }
    if (json && typeof json === 'object') {
      const o = json as Record<string, unknown>;
      if (typeof o.message === 'string' && o.message.trim()) {
        return o.message.trim();
      }
      const err = o.error;
      if (typeof err === 'string' && err.trim()) return err.trim();
    }
    const trimmed = text.trim().slice(0, 280);
    if (trimmed) return trimmed;
    return `Melhor Envio respondeu HTTP ${status}. Verifique CEPs, dimensões do pacote e a conta (sandbox vs produção).`;
  }

  private collectMeQuoteErrors(quotes: unknown[]): string[] {
    const out: string[] = [];
    for (const row of quotes) {
      if (!row || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      const err = o.error;
      if (typeof err === 'string' && err.trim()) out.push(err.trim());
      else if (err && typeof err === 'object') {
        const m = (err as Record<string, unknown>).message;
        if (typeof m === 'string' && m.trim()) out.push(m.trim());
      }
    }
    return out;
  }

  private pickCheapestQuoteOption(quotes: unknown[]): { serviceId: number; price: number } {
    let best: { serviceId: number; price: number } | null = null;
    for (const row of quotes) {
      if (!row || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      if ('error' in o && o.error) continue;
      const sid = typeof o.id === 'number' && Number.isInteger(o.id) ? o.id : null;
      if (sid == null) continue;
      const p = this.parsePriceBrl(o.custom_price ?? o.price);
      if (p === null) continue;
      if (!best || p < best.price) best = { serviceId: sid, price: p };
    }
    if (!best) {
      const hints = this.collectMeQuoteErrors(quotes);
      const detail =
        hints.length > 0
          ? hints.slice(0, 2).join(' · ')
          : 'nenhum transportador retornou preço para este CEP e pacote';
      throw new BadRequestException(
        `Melhor Envio não retornou preços de frete para esta rota (${detail}).`,
      );
    }
    return { serviceId: best.serviceId, price: Math.round(best.price * 100) / 100 };
  }

  private async postMeJson(
    path: string,
    body: unknown,
  ): Promise<{ ok: boolean; status: number; json: unknown | null; text: string }> {
    const token = await this.getBearerTokenForShipping();
    const base = this.getApiBase();
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    const postOnce = async (bearer: string) =>
      fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
          'User-Agent': this.getUserAgent(),
        },
        body: JSON.stringify(body),
      });

    let res = await postOnce(token);
    let text = await res.text();
    if (res.status === 401) {
      const row = await this.prisma.melhorEnvioOAuthToken.findUnique({
        where: { id: OAUTH_ROW_ID },
      });
      if (row && !this.config.get<string>('MELHOR_ENVIO_ACCESS_TOKEN')?.trim()) {
        const tokens = await this.refreshOAuthToken(row.refreshToken);
        await this.persistOAuthTokens(tokens);
        const nextTok = await this.getBearerTokenForShipping();
        res = await postOnce(nextTok);
        text = await res.text();
      }
    }
    let json: unknown | null = null;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text };
  }

  private async shipmentCalculate(body: Record<string, unknown>): Promise<unknown[]> {
    const { ok, status, json, text } = await this.postMeJson('/api/v2/me/shipment/calculate', body);
    if (!ok) {
      this.log.warn(`ME shipment/calculate ${status}: ${text.slice(0, 400)}`);
      throw new BadRequestException(this.formatMeApiError(status, json, text));
    }
    if (!Array.isArray(json)) {
      throw new BadRequestException('Melhor Envio retornou formato inesperado na cotação.');
    }
    return json;
  }

  /**
   * Cotação por caixa (um produto fictício) — preço e id do serviço ME mais barato.
   * @see https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos
   */
  async quoteCheapestForProductBoxWithService(params: {
    fromPostalCode: string;
    toPostalCode: string;
    productId: string;
    widthCm: number;
    heightCm: number;
    lengthCm: number;
    weightKg: number;
    /** Valor segurado por unidade (a API ME multiplica pela quantity). */
    insuranceValueBrl: number;
    quantity: number;
  }): Promise<{ price: number; serviceId: number }> {
    const from = params.fromPostalCode.replace(/\D/g, '').slice(0, 8);
    const to = params.toPostalCode.replace(/\D/g, '').slice(0, 8);
    if (from.length !== 8 || to.length !== 8) {
      throw new BadRequestException('CEP de origem ou destino inválido para Melhor Envio.');
    }
    const w = Math.max(1, Math.round(params.widthCm));
    const h = Math.max(1, Math.round(params.heightCm));
    const len = Math.max(1, Math.round(params.lengthCm));
    const weight = Math.max(0.01, params.weightKg);
    const insurance = Math.round(Math.max(0, params.insuranceValueBrl) * 100) / 100;
    const qty = Math.min(99, Math.max(1, Math.floor(params.quantity)));

    const body: Record<string, unknown> = {
      from: { postal_code: from },
      to: { postal_code: to },
      products: [
        {
          id: params.productId.slice(0, 64),
          width: w,
          height: h,
          length: len,
          weight,
          insurance_value: insurance,
          quantity: qty,
        },
      ],
      options: { receipt: false, own_hand: false },
    };
    const serviceIds = this.config.get<string>('MELHOR_ENVIO_SERVICE_IDS')?.trim();
    if (serviceIds) {
      body.services = serviceIds;
    }
    const arr = await this.shipmentCalculate(body);
    return this.pickCheapestQuoteOption(arr);
  }

  /** Cotação pública (CEP origem → CEP destino), menor `custom_price`. */
  async quoteCheapestProductShipping(params: {
    fromPostalCode: string;
    toPostalCode: string;
    productId: string;
    widthCm: number;
    heightCm: number;
    lengthCm: number;
    weightKg: number;
    insuranceValueBrl: number;
    quantity: number;
  }): Promise<number> {
    return (await this.quoteCheapestForProductBoxWithService(params)).price;
  }

  /**
   * Insumos fornecedor → costureira: carrinho, checkout, geração e link público de impressão.
   * Documentos fiscais vêm das contas (`fiscalDocument` / `fiscalDocumentKind`), não de .env.
   */
  async purchaseSupplierInsumoShipment(params: {
    fromParty: MeFiscalParty;
    toParty: MeFiscalParty;
    fromPostalCode: string;
    toPostalCode: string;
    serviceId: number;
    from: {
      name: string;
      email: string;
      phone: string;
      address: string;
      number: string;
      complement: string;
      district: string;
      city: string;
      state_abbr: string;
      postal_code: string;
      state_register: string;
    };
    to: {
      name: string;
      email: string;
      phone: string;
      address: string;
      number: string;
      complement: string;
      district: string;
      city: string;
      state_abbr: string;
      postal_code: string;
      country_id: string;
    };
    volumes: { height: number; width: number; length: number; weight: number }[];
    products: { name: string; quantity: number; unitary_value: number }[];
    insuranceValueBrl: number;
    platformTag: string;
  }): Promise<{ orderId: string; printUrl: string }> {
    const fromPersonDoc = params.fromParty.kind === 'CPF' ? params.fromParty.digits : '';
    const fromCompanyDoc = params.fromParty.kind === 'CNPJ' ? params.fromParty.digits : '';
    const toDoc = params.toParty.digits;

    if (params.fromParty.kind === 'CPF' && fromPersonDoc.length !== 11) {
      throw new BadRequestException('CPF do remetente inválido para Melhor Envio.');
    }
    if (params.fromParty.kind === 'CNPJ' && fromCompanyDoc.length !== 14) {
      throw new BadRequestException('CNPJ do remetente inválido para Melhor Envio.');
    }
    if (params.toParty.kind === 'CPF' && toDoc.length !== 11) {
      throw new BadRequestException('CPF do destinatário inválido para Melhor Envio.');
    }
    if (params.toParty.kind === 'CNPJ' && toDoc.length !== 14) {
      throw new BadRequestException('CNPJ do destinatário inválido para Melhor Envio.');
    }

    const cartBody = {
      service: params.serviceId,
      from: {
        name: params.from.name.slice(0, 120),
        email: params.from.email.trim(),
        phone: params.from.phone.replace(/\D/g, '').slice(0, 11),
        document: fromPersonDoc.slice(0, 11),
        company_document: fromCompanyDoc,
        state_register: params.from.state_register || 'ISENTO',
        address: params.from.address.slice(0, 200),
        complement: (params.from.complement || '').slice(0, 120),
        number: params.from.number.slice(0, 20),
        district: params.from.district.slice(0, 120),
        city: params.from.city.slice(0, 120),
        postal_code: params.from.postal_code.replace(/\D/g, '').slice(0, 8),
        state_abbr: params.from.state_abbr.slice(0, 2).toUpperCase(),
      },
      to: {
        name: params.to.name.slice(0, 120),
        email: params.to.email.trim(),
        phone: params.to.phone.replace(/\D/g, '').slice(0, 11),
        document: toDoc.replace(/\D/g, '').slice(0, 14),
        state_register: 'ISENTO',
        address: params.to.address.slice(0, 200),
        complement: (params.to.complement || '').slice(0, 120),
        number: params.to.number.slice(0, 20),
        district: params.to.district.slice(0, 120),
        city: params.to.city.slice(0, 120),
        postal_code: params.to.postal_code.replace(/\D/g, '').slice(0, 8),
        country_id: params.to.country_id || 'BR',
        state_abbr: params.to.state_abbr.slice(0, 2).toUpperCase(),
      },
      products: params.products.map((p) => ({
        name: p.name.slice(0, 120),
        quantity: String(Math.max(1, Math.floor(p.quantity))),
        unitary_value: String(Math.round(Math.max(0.01, p.unitary_value) * 100) / 100),
      })),
      volumes: params.volumes.map((v) => ({
        height: Math.max(1, Math.round(v.height)),
        width: Math.max(1, Math.round(v.width)),
        length: Math.max(1, Math.round(v.length)),
        weight: Math.max(0.001, v.weight),
      })),
      options: {
        platform: 'AgregadorServicos',
        reminder: params.platformTag.slice(0, 200),
        insurance_value: Math.round(Math.max(0, params.insuranceValueBrl) * 100) / 100,
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: true,
      },
    };

    const cart = await this.postMeJson('/api/v2/me/cart', cartBody);
    if (!cart.ok || cart.status !== 201) {
      this.log.warn(`ME cart ${cart.status}: ${cart.text.slice(0, 500)}`);
      throw new BadRequestException('Melhor Envio recusou inserir o envio no carrinho.');
    }
    const cartJson = cart.json as Record<string, unknown> | null;
    const orderId = typeof cartJson?.id === 'string' ? cartJson.id.trim() : '';
    if (!orderId) {
      throw new BadRequestException('Melhor Envio não devolveu o id do pedido no carrinho.');
    }

    const checkout = await this.postMeJson('/api/v2/me/shipment/checkout', { orders: [orderId] });
    if (!checkout.ok) {
      this.log.warn(`ME checkout ${checkout.status}: ${checkout.text.slice(0, 500)}`);
      throw new BadRequestException(
        'Melhor Envio não concluiu o pagamento do frete (verifique saldo na carteira ME).',
      );
    }

    const gen = await this.postMeJson('/api/v2/me/shipment/generate', { orders: [orderId] });
    if (!gen.ok) {
      this.log.warn(`ME generate ${gen.status}: ${gen.text.slice(0, 500)}`);
      throw new BadRequestException('Melhor Envio não gerou a etiqueta.');
    }

    const print = await this.postMeJson('/api/v2/me/shipment/print', {
      orders: [orderId],
      mode: 'public',
    });
    if (!print.ok || !print.json || typeof print.json !== 'object') {
      this.log.warn(`ME print ${print.status}: ${print.text.slice(0, 500)}`);
      throw new BadRequestException('Melhor Envio não devolveu o link de impressão.');
    }
    const url = (print.json as Record<string, unknown>).url;
    if (typeof url !== 'string' || !url.startsWith('http')) {
      throw new BadRequestException('Resposta de impressão ME sem URL válida.');
    }
    return { orderId, printUrl: url };
  }

  /**
   * X-ME-Signature: HMAC-SHA256 do corpo bruto em Base64, chave = client_secret.
   * @see https://docs.melhorenvio.com.br/docs/webhooks
   */
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!signatureHeader?.trim()) return false;
    const secret = this.config.get<string>('MELHOR_ENVIO_CLIENT_SECRET')?.trim();
    if (!secret) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('base64');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signatureHeader.trim(), 'utf8');
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  logTokenReceived(tokens: TokenResponse): void {
    const mask = (s: string) => (s.length > 12 ? `${s.slice(0, 8)}…${s.slice(-4)}` : '(curto)');
    this.log.log(
      `Melhor Envio: tokens gravados (access ${mask(tokens.access_token)}, refresh ${mask(tokens.refresh_token)}, expira em ${tokens.expires_in}s).`,
    );
  }
}
