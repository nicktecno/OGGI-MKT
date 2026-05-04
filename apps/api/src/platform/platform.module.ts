import { Module } from '@nestjs/common';
import { AccountsMeController } from './accounts-me.controller';
import { InternalPlatformController } from './internal-platform.controller';
import { StripeConnectController } from './stripe-connect.controller';
import { StripeConnectService } from './stripe-connect.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  controllers: [
    AccountsMeController,
    InternalPlatformController,
    StripeConnectController,
    StripeWebhookController,
  ],
  providers: [StripeConnectService, StripeWebhookService],
})
export class PlatformModule {}
