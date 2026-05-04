import { Module } from '@nestjs/common';
import { AuthPublicController } from './auth-public.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthPublicController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
