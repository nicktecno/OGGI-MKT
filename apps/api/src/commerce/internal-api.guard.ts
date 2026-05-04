import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('INTERNAL_API_SECRET')?.trim();
    if (!secret) {
      throw new UnauthorizedException('Integração interna não configurada neste servidor.');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['x-internal-secret'];
    const value = Array.isArray(header) ? header[0] : header;
    if (value !== secret) {
      throw new UnauthorizedException('Credencial interna inválida.');
    }
    return true;
  }
}
