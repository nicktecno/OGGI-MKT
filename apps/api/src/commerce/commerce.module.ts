import { Module } from '@nestjs/common';
import { SupplyModule } from '../supply/supply.module';
import { CommerceInternalController } from './commerce-internal.controller';
import { CommerceService } from './commerce.service';
import { R2StorageService } from '../storage/r2-storage.service';

@Module({
  imports: [SupplyModule],
  controllers: [CommerceInternalController],
  providers: [CommerceService, R2StorageService],
  exports: [CommerceService],
})
export class CommerceModule {}
