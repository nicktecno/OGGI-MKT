import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Resposta documentada em https://docs.melhorenvio.com.br/reference/solicitacao-do-token */
type TokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

@Injectable()
export class MelhorEnvioService {
  private readonly log = new Logger(MelhorEnvioService.name);

  constructor(private readonly config: ConfigService) {}

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
   * Persistência dos tokens (BD/secret manager) fica para a evolução da integração.
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
      `Melhor Envio: token recebido (access ${mask(tokens.access_token)}, refresh ${mask(tokens.refresh_token)}, expira em ${tokens.expires_in}s). Guarde estes valores de forma segura na próxima iteração.`,
    );
  }
}
