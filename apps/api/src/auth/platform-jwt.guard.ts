import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtVerify } from 'jose';
import type { Request } from 'express';
import { getAuthSecretKey } from '../lib/auth-secret';

export type PlatformJwtUser = {
  sub: string;
  email: string;
  role: string;
  name?: string;
  accountStatus: string;
};

@Injectable()
export class PlatformJwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) {
      throw new UnauthorizedException('Token ausente.');
    }
    try {
      const { payload } = await jwtVerify(token, getAuthSecretKey(), {
        algorithms: ['HS256'],
      });
      const sub = typeof payload.sub === 'string' ? payload.sub : null;
      const email = typeof payload.email === 'string' ? payload.email : null;
      const role = typeof payload.role === 'string' ? payload.role : null;
      const accountStatus =
        typeof payload.accountStatus === 'string' ? payload.accountStatus : null;
      if (!sub || !email || !role || !accountStatus) {
        throw new UnauthorizedException('Token inválido.');
      }
      (req as Request & { platformUser: PlatformJwtUser }).platformUser = {
        sub,
        email,
        role,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        accountStatus,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
  }
}
