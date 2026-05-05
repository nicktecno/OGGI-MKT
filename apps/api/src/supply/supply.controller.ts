import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express, Request } from 'express';
import { PlatformJwtGuard, type PlatformJwtUser } from '../auth/platform-jwt.guard';
import { CreateSupplyItemDto } from './dto/create-supply-item.dto';
import { RecalculateFreteDto } from './dto/recalculate-frete.dto';
import { UpdateSupplyItemDto } from './dto/update-supply-item.dto';
import { SupplierFulfillmentService } from './supplier-fulfillment.service';
import { SupplyService } from './supply.service';

@Controller('supply-items')
@UseGuards(PlatformJwtGuard)
export class SupplyController {
  constructor(
    private readonly supply: SupplyService,
    private readonly fulfillment: SupplierFulfillmentService,
  ) {}

  @Get()
  list(@Req() req: Request & { platformUser: PlatformJwtUser }) {
    return this.supply.listForUser(req.platformUser);
  }

  /** Entregas aos executores (insumos ligados a atribuições; etiqueta Melhor Envio quando integrado). */
  @Get('fulfillment-lines')
  listFulfillment(@Req() req: Request & { platformUser: PlatformJwtUser }) {
    if (req.platformUser.role !== 'SUPPLIER') {
      throw new ForbiddenException('Apenas fornecedores consultam entregas.');
    }
    return this.fulfillment.listForSupplier(req.platformUser.sub);
  }

  /** Ajuste manual do pacote do envio ao executor + recálculo (stub ME até integração). */
  @Post('fulfillment-lines/recalculate-frete')
  recalcFrete(
    @Req() req: Request & { platformUser: PlatformJwtUser },
    @Body() body: RecalculateFreteDto,
  ) {
    return this.fulfillment.recalculateFreteForAssignment(req.platformUser, body.productionAssignmentId, {
      alturaCm: body.alturaCm,
      larguraCm: body.larguraCm,
      comprimentoCm: body.comprimentoCm,
      pesoKg: body.pesoKg,
    });
  }

  @Post()
  create(
    @Req() req: Request & { platformUser: PlatformJwtUser },
    @Body() body: CreateSupplyItemDto,
  ) {
    return this.supply.create(req.platformUser, body);
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1024 * 1024 },
    }),
  )
  uploadImage(
    @Req() req: Request & { platformUser: PlatformJwtUser },
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.supply.uploadImage(req.platformUser, id, file.buffer, file.mimetype);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { platformUser: PlatformJwtUser },
    @Param('id') id: string,
    @Body() body: UpdateSupplyItemDto,
  ) {
    return this.supply.update(req.platformUser, id, body);
  }

  @Delete(':id')
  remove(@Req() req: Request & { platformUser: PlatformJwtUser }, @Param('id') id: string) {
    return this.supply.delete(req.platformUser, id);
  }
}
