import { SupplyQuantityKind } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Min, MinLength } from 'class-validator';

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

  @Min(0)
  custoFornecedor!: number;

  /** Opcional: antes da atribuição ao executor o frete costuma ser estimado pelo Melhor Envio. */
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
}
