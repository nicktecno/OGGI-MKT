import { IsBoolean, IsOptional, IsString, Min, MinLength } from 'class-validator';

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
  @IsString()
  @MinLength(1)
  unidade?: string;

  @IsOptional()
  @Min(0)
  custoFornecedor?: number;

  @IsOptional()
  @Min(0)
  freteAteExecutor?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
