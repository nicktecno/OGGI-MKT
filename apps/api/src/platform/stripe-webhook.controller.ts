import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common/interfaces/http/raw-body-request.interface';
import type { Request } from 'express';
import Stripe from 'stripe';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('webhooks/stripe')
@SkipThrottle()
export class StripeWebhookController {
  constructor(private readonly webhooks: StripeWebhookService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const apiKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!whSecret || !apiKey) {
      throw new ServiceUnavailableException('Webhooks Stripe não configurados.');
    }
    const rawBody = req.rawBody;
    if (!Buffer.isBuffer(rawBody)) {
      throw new BadRequestException('Corpo bruto ausente para verificação da assinatura.');
    }
    if (!signature) {
      throw new BadRequestException('Cabeçalho stripe-signature ausente.');
    }
    const stripe = new Stripe(apiKey, { typescript: true });
    let event: ReturnType<typeof stripe.webhooks.constructEvent>;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, whSecret);
    } catch {
      throw new BadRequestException('Assinatura inválida.');
    }
    await this.webhooks.handleEvent(event);
    return { received: true };
  }
}
