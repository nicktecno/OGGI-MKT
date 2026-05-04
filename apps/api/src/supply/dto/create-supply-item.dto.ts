import { IsBoolean, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateSupplyItemDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @IsString()
  @MinLength(1)
  skuInterno!: string;

  @IsString()
  @MinLength(1)
  unidade!: string;

  @Min(0)
  custoFornecedor!: number;

  @Min(0)
  freteAteExecutor!: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
