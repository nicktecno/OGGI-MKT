import { Module } from '@nestjs/common';
import { ContactPublicController } from './contact-public.controller';

@Module({
  controllers: [ContactPublicController],
})
export class ContactModule {}
