import { SupplyQuantityKind } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateSupplyItemDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @IsString()
  @MinLength(1)
  skuInterno!: string;

  @IsEnum(SupplyQuantityKind)
  quantidadeKind!: SupplyQuantityKind;

  @Min(0.0001)
  quantidade!: number;

  /** Opcional: o admin pode precificar só na montagem da peça no painel. */
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
