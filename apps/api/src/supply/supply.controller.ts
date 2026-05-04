import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformJwtGuard, type PlatformJwtUser } from '../auth/platform-jwt.guard';
import { CreateSupplyItemDto } from './dto/create-supply-item.dto';
import { UpdateSupplyItemDto } from './dto/update-supply-item.dto';
import { SupplyService } from './supply.service';

@Controller('supply-items')
@UseGuards(PlatformJwtGuard)
export class SupplyController {
  constructor(private readonly supply: SupplyService) {}

  @Get()
  list(@Req() req: Request & { platformUser: PlatformJwtUser }) {
    return this.supply.listForUser(req.platformUser);
  }

  @Post()
  create(
    @Req() req: Request & { platformUser: PlatformJwtUser },
    @Body() body: CreateSupplyItemDto,
  ) {
    return this.supply.create(req.platformUser, body);
  }

  @Patch(':id')
  update(
    @Req() req: Request & { platformUser: PlatformJwtUser },
    @Param('id') id: string,
    @Body() body: UpdateSupplyItemDto,
  ) {
    return this.supply.update(req.platformUser, id, body);
  }
}
