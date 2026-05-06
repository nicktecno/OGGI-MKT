import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  /**
   * Cotação pública (CEP executor → CEP cliente), menor `custom_price` entre serviços.
   * @see https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos
   */
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

    const token = await this.getBearerTokenForShipping();
    const base = this.getApiBase();
    const url = `${base}/api/v2/me/shipment/calculate`;
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

    const postOnce = async (bearer: string) => {
      return fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
          'User-Agent': this.getUserAgent(),
        },
        body: JSON.stringify(body),
      });
    };

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

    if (!res.ok) {
      this.log.warn(`ME shipment/calculate ${res.status}: ${text.slice(0, 400)}`);
      throw new BadRequestException(
        'Melhor Envio não cotou este envio. Verifique CEPs, dimensões e a conta na sandbox/produção.',
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new BadRequestException('Melhor Envio retornou JSON inválido na cotação.');
    }
    if (!Array.isArray(data)) {
      throw new BadRequestException('Melhor Envio retornou formato inesperado na cotação.');
    }

    let min = Infinity;
    for (const row of data) {
      if (!row || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      if ('error' in o && o.error) continue;
      const p = this.parsePriceBrl(o.custom_price ?? o.price);
      if (p !== null && p < min) min = p;
    }
    if (!Number.isFinite(min)) {
      throw new BadRequestException('Melhor Envio não retornou preços de frete para esta rota.');
    }
    return Math.round(min * 100) / 100;
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
