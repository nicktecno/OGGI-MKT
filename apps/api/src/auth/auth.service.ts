import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import type { PlatformAccount } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { assertValidFiscalDocument, type FiscalDocumentKind } from '../platform/fiscal-document.util';
import { PrismaService } from '../prisma/prisma.service';
import { TERMS_ACCEPTANCE_VERSION } from '../legal/terms-acceptance-version';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  serializePublic(account: PlatformAccount) {
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      status: account.status,
      stripeOnboardingComplete: account.stripeOnboardingComplete,
      stripeAccountId: account.stripeAccountId ? '***' : null,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.platformAccount.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const fiscalKind = (dto.fiscalDocumentKind === 'CNPJ' ? 'CNPJ' : 'CPF') as FiscalDocumentKind;
    const fiscalDigits = assertValidFiscalDocument(fiscalKind, dto.fiscalDocument);

    if (dto.role === 'CUSTOMER') {
      const account = await this.prisma.platformAccount.create({
        data: {
          email,
          passwordHash: hash,
          name: dto.name.trim(),
          role: 'CUSTOMER',
          status: 'ACTIVE',
          fiscalDocumentKind: fiscalKind,
          fiscalDocument: fiscalDigits,
          termsAcceptedAt: new Date(),
          termsAcceptedVersion: TERMS_ACCEPTANCE_VERSION.CUSTOMER,
        },
      });
      this.notifications.fireAndForgetCustomerWelcome({
        email: account.email,
        name: account.name,
      });
      return { user: this.serializePublic(account) };
    }

    if (dto.role === 'SUPPLIER') {
      if (
        !dto.businessName?.trim() ||
        !dto.cep?.trim() ||
        !dto.phone?.trim() ||
        !dto.addressLine1?.trim() ||
        !dto.city?.trim() ||
        !dto.stateUf?.trim()
      ) {
        throw new BadRequestException('Preencha todos os dados do fornecedor (razão social, CEP, telefone, endereço, cidade e UF).');
      }
      const account = await this.prisma.platformAccount.create({
        data: {
          email,
          passwordHash: hash,
          name: dto.name.trim(),
          role: 'SUPPLIER',
          status: 'PENDING_ADMIN_REVIEW',
          fiscalDocumentKind: fiscalKind,
          fiscalDocument: fiscalDigits,
          termsAcceptedAt: new Date(),
          termsAcceptedVersion: TERMS_ACCEPTANCE_VERSION.SUPPLIER,
          supplierProfile: {
            create: {
              businessName: dto.businessName.trim(),
              cep: dto.cep.trim(),
              phone: dto.phone.trim(),
              addressLine1: dto.addressLine1.trim(),
              addressComplement: dto.addressComplement?.trim() || null,
              city: dto.city.trim(),
              stateUf: dto.stateUf.trim().toUpperCase(),
            },
          },
        },
      });
      this.notifications.fireAndForgetPendingAccount({
        email: account.email,
        name: account.name,
        role: 'SUPPLIER',
      });
      this.notifications.fireAndForgetPendingPartnerAck({
        email: account.email,
        name: account.name,
        role: 'SUPPLIER',
      });
      return { user: this.serializePublic(account) };
    }

    if (
      !dto.displayName?.trim() ||
      !dto.executorCep?.trim() ||
      !dto.executorPhone?.trim() ||
      !dto.executorAddressLine1?.trim() ||
      !dto.executorCity?.trim() ||
      !dto.executorStateUf?.trim()
    ) {
      throw new BadRequestException('Preencha todos os dados da costureira (nome público, CEP, telefone, endereço, cidade e UF).');
    }
    const account = await this.prisma.platformAccount.create({
      data: {
        email,
        passwordHash: hash,
        name: dto.name.trim(),
        role: 'EXECUTOR',
        status: 'PENDING_ADMIN_REVIEW',
        fiscalDocumentKind: fiscalKind,
        fiscalDocument: fiscalDigits,
        termsAcceptedAt: new Date(),
        termsAcceptedVersion: TERMS_ACCEPTANCE_VERSION.EXECUTOR,
        executorProfile: {
          create: {
            displayName: dto.displayName.trim(),
            cep: dto.executorCep.trim(),
            phone: dto.executorPhone.trim(),
            addressLine1: dto.executorAddressLine1.trim(),
            addressComplement: dto.executorAddressComplement?.trim() || null,
            city: dto.executorCity.trim(),
            stateUf: dto.executorStateUf.trim().toUpperCase(),
          },
        },
      },
    });
    this.notifications.fireAndForgetPendingAccount({
      email: account.email,
      name: account.name,
      role: 'EXECUTOR',
    });
    this.notifications.fireAndForgetPendingPartnerAck({
      email: account.email,
      name: account.name,
      role: 'EXECUTOR',
    });
    return { user: this.serializePublic(account) };
  }

  async requestPasswordReset(email: string): Promise<{ ok: true }> {
    const normalized = email.trim().toLowerCase();
    const account = await this.prisma.platformAccount.findUnique({
      where: { email: normalized },
    });
    if (!account) {
      return { ok: true };
    }
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.deleteMany({
      where: { email: normalized, usedAt: null },
    });
    await this.prisma.passwordResetToken.create({
      data: {
        email: normalized,
        tokenHash,
        expiresAt,
      },
    });
    const raw = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:3000';
    const base = raw.replace(/\/$/, '');
    const resetUrl = `${base}/recuperar-senha?token=${encodeURIComponent(rawToken)}`;
    this.notifications.fireAndForgetPasswordResetRequested({
      email: normalized,
      name: account.name,
      resetUrl,
    });
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    const trimmed = token.trim();
    if (trimmed.length < 32) {
      throw new BadRequestException('Link inválido ou expirado.');
    }
    const tokenHash = createHash('sha256').update(trimmed).digest('hex');
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Link inválido ou expirado.');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.platformAccount.update({
        where: { email: row.email },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { email: row.email, id: { not: row.id } },
      }),
    ]);
    return { ok: true };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const account = await this.prisma.platformAccount.findUnique({ where: { email } });
    if (!account) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    const ok = await bcrypt.compare(dto.password, account.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    return { user: this.serializePublic(account) };
  }
}
