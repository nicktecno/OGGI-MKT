import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CheckoutShippingQuoteLineDto {
  @IsString()
  listing_id!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class CheckoutShippingQuoteDto {
  /** CEP de entrega (com ou sem máscara; deve conter 8 dígitos). */
  @IsString()
  @MinLength(8, { message: 'CEP inválido.' })
  cep_destino!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CheckoutShippingQuoteLineDto)
  lines!: CheckoutShippingQuoteLineDto[];
}
