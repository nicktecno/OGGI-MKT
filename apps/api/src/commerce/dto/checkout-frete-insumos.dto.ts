import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CheckoutShippingQuoteLineDto } from './checkout-shipping-quote.dto';

/** Linhas do carrinho (oferta + quantidade), sem CEP — só para breakdown de frete B2B embutido. */
export class CheckoutFreteInsumosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CheckoutShippingQuoteLineDto)
  lines!: CheckoutShippingQuoteLineDto[];
}
