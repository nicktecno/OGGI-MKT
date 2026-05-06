import { Body, Controller, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { NotificationsService } from '../notifications/notifications.service';
import { ContactFormDto } from './dto/contact-form.dto';

@Controller('public/contact')
export class ContactPublicController {
  constructor(private readonly notifications: NotificationsService) {}

  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @Post()
  async submit(@Body() body: ContactFormDto, @Req() req: Request) {
    const fwd = req.headers['x-forwarded-for'];
    const clientIp =
      typeof fwd === 'string'
        ? fwd
            .split(',')[0]
            ?.trim() || null
        : Array.isArray(fwd)
          ? fwd[0]?.trim() || null
          : req.socket?.remoteAddress || null;

    await this.notifications.onPublicContactMessage({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      subject: body.subject?.trim(),
      message: body.message.trim(),
      clientIp,
    });
    return { ok: true as const };
  }
}
