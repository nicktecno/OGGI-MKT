import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common/interfaces/http/raw-body-request.interface';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { MelhorEnvioService } from './melhor-envio.service';

@Controller()
@SkipThrottle()
export class MelhorEnvioController {
  private readonly log = new Logger(MelhorEnvioController.name);

  constructor(
    private readonly me: MelhorEnvioService,
    private readonly config: ConfigService,
  ) {}

  private frontendOrigin(): string {
    const raw = this.config.get<string>('FRONTEND_URL')?.trim() || 'http://localhost:3000';
    return raw.split(',')[0]?.trim() || 'http://localhost:3000';
  }

  /**
   * Callback OAuth2 — cadastre esta URL exata no app (Área Dev).
   * Ex.: https://api.seudominio.com.br/oauth/melhor-envio/callback
   */
  @Get('oauth/melhor-envio/callback')
  async oauthCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() res: Response,
  ) {
    const front = this.frontendOrigin();
    const base = `${front.replace(/\/$/, '')}/painel/admin`;

    if (error) {
      const msg = errorDescription || error;
      return res.redirect(302, `${base}?me_oauth_error=${encodeURIComponent(msg)}`);
    }
    if (!code?.trim()) {
      return res.redirect(302, `${base}?me_oauth_error=${encodeURIComponent('Código de autorização ausente.')}`);
    }

    try {
      const tokens = await this.me.exchangeAuthorizationCode(code);
      this.me.logTokenReceived(tokens);
      return res.redirect(
        302,
        `${base}?me_oauth=ok&me_state=${encodeURIComponent(state ?? '')}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao obter token.';
      this.log.warn(`OAuth ME callback: ${msg}`);
      return res.redirect(302, `${base}?me_oauth_error=${encodeURIComponent(msg)}`);
    }
  }

  /**
   * Redireciona o browser para a página de autorização da Melhor Envio.
   * Uso: abrir no navegador (admin) GET /integrations/melhor-envio/start?state=opcional
   */
  @Get('integrations/melhor-envio/start')
  startOAuth(@Query('state') state: string | undefined, @Res() res: Response) {
    try {
      const url = this.me.buildAuthorizationUrl(state?.trim() || 'admin');
      return res.redirect(302, url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Configuração incompleta.';
      throw new ServiceUnavailableException(msg);
    }
  }

  /**
   * Webhook de eventos de etiqueta — cadastre no painel ME: POST para esta URL pública.
   * Ex.: https://api.seudominio.com.br/webhooks/melhor-envio
   */
  @Post('webhooks/melhor-envio')
  @HttpCode(200)
  async webhook(
    @Headers('x-me-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const secret = this.config.get<string>('MELHOR_ENVIO_CLIENT_SECRET')?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('MELHOR_ENVIO_CLIENT_SECRET não configurado.');
    }
    const rawBody = req.rawBody;
    if (!Buffer.isBuffer(rawBody)) {
      throw new BadRequestException('Corpo bruto ausente para verificação X-ME-Signature.');
    }
    if (!this.me.verifyWebhookSignature(rawBody, signature)) {
      this.log.warn('Webhook ME: assinatura inválida ou cabeçalho ausente.');
      throw new BadRequestException('Assinatura inválida.');
    }
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('JSON inválido.');
    }
    const event = (payload as { event?: string })?.event ?? '(sem event)';
    this.log.log(`Webhook ME recebido: ${event}`);
    // Próximo passo: atualizar SupplierFulfillmentLine / Order conforme domain-model.
    return { received: true };
  }
}
