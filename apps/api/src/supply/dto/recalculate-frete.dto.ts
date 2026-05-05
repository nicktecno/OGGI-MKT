import { Type } from 'class-transformer';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class RecalculateFreteDto {
  @IsString()
  @MinLength(2)
  productionAssignmentId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  alturaCm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  larguraCm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  comprimentoCm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  pesoKg!: number;
}
