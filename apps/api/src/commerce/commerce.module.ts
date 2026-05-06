import { Module } from '@nestjs/common';
import { MelhorEnvioModule } from '../melhor-envio/melhor-envio.module';
import { SupplyModule } from '../supply/supply.module';
import { CommerceInternalController } from './commerce-internal.controller';
import { CommercePublicController } from './commerce-public.controller';
import { CommerceService } from './commerce.service';
import { R2StorageService } from '../storage/r2-storage.service';

@Module({
  imports: [SupplyModule, MelhorEnvioModule],
  controllers: [CommerceInternalController, CommercePublicController],
  providers: [CommerceService, R2StorageService],
  exports: [CommerceService],
})
export class CommerceModule {}
