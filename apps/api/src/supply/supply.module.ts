import { Module } from '@nestjs/common';
import { R2StorageService } from '../storage/r2-storage.service';
import { SupplierFulfillmentService } from './supplier-fulfillment.service';
import { SupplyController } from './supply.controller';
import { SupplyService } from './supply.service';

@Module({
  controllers: [SupplyController],
  providers: [SupplyService, SupplierFulfillmentService, R2StorageService],
  exports: [SupplyService, SupplierFulfillmentService],
})
export class SupplyModule {}
