import { SupplyQuantityKind } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateSupplyItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  skuInterno?: string;

  @IsOptional()
  @IsEnum(SupplyQuantityKind)
  quantidadeKind?: SupplyQuantityKind;

  @IsOptional()
  @Min(0.0001)
  quantidade?: number;

  @IsOptional()
  @Min(0)
  custoFornecedor?: number;

  @IsOptional()
  @Min(0)
  freteAteExecutor?: number;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  pacoteAlturaCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  pacoteLarguraCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  pacoteComprimentoCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  pacotePesoKg?: number;
}
