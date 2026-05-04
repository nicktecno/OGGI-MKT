import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformJwtGuard, type PlatformJwtUser } from '../auth/platform-jwt.guard';
import { StripeConnectService } from './stripe-connect.service';

@Controller('public/stripe')
@UseGuards(PlatformJwtGuard)
export class StripeConnectController {
  constructor(private readonly stripe: StripeConnectService) {}

  @Post('account-link')
  createLink(@Req() req: Request & { platformUser: PlatformJwtUser }) {
    return this.stripe.createAccountLink(req.platformUser.sub);
  }
}
