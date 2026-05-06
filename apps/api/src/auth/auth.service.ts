import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { PlatformAccount } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
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

    if (dto.role === 'CUSTOMER') {
      const account = await this.prisma.platformAccount.create({
        data: {
          email,
          passwordHash: hash,
          name: dto.name.trim(),
          role: 'CUSTOMER',
          status: 'ACTIVE',
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
    return { user: this.serializePublic(account) };
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
