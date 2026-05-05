import { Controller, Get, Header } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/** Resposta leve para load balancers e pings externos (ex.: manter dyno acordado no Render). */
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  health() {
    return { status: 'ok', service: 'api', ts: new Date().toISOString() };
  }
}
