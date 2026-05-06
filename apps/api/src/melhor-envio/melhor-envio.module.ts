import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MelhorEnvioController } from './melhor-envio.controller';
import { MelhorEnvioService } from './melhor-envio.service';

@Module({
  imports: [PrismaModule],
  controllers: [MelhorEnvioController],
  providers: [MelhorEnvioService],
  exports: [MelhorEnvioService],
})
export class MelhorEnvioModule {}
