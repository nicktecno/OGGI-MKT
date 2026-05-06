import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PatchMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(['CPF', 'CNPJ'])
  fiscalDocumentKind?: 'CPF' | 'CNPJ';

  @IsOptional()
  @IsString()
  @MinLength(11)
  @MaxLength(20)
  fiscalDocument?: string;
}
