import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Objeto mínimo de `account.updated` (webhook Stripe). */
type StripeConnectAccountPayload = {
  id: string;
  details_submitted?: boolean | null;
};

@Injectable()
export class StripeWebhookService {
  private readonly log = new Logger(StripeWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleEvent(event: { type: string; data: { object: unknown } }): Promise<void> {
    switch (event.type) {
      case 'account.updated': {
        const acct = event.data.object as StripeConnectAccountPayload;
        const stripeAccountId = acct.id;
        const onboardingDone = Boolean(acct.details_submitted);
        const r = await this.prisma.platformAccount.updateMany({
          where: { stripeAccountId },
          data: { stripeOnboardingComplete: onboardingDone },
        });
        if (r.count > 0) {
          this.log.log(`Connect onboarding flag atualizada (${stripeAccountId}): ${onboardingDone}`);
        }
        break;
      }
      default:
        this.log.debug(`Evento Stripe ignorado: ${event.type}`);
    }
  }
}
