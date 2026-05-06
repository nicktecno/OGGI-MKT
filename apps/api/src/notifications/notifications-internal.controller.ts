import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InternalApiGuard } from '../commerce/internal-api.guard';
import { NotificationsService } from './notifications.service';

@Controller('internal/notifications')
@UseGuards(InternalApiGuard)
@SkipThrottle()
export class NotificationsInternalController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Chamado pelo Next após checkout demo ou pós-Stripe (estoque já baixado). */
  @Post('store-order')
  storeOrder(
    @Body()
    body: {
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
    },
  ) {
    this.notifications.fireAndForgetStoreOrder(body);
    return { ok: true as const };
  }
}
