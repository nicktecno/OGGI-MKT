import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommerceService } from './commerce.service';
import { CheckoutShippingQuoteDto } from './dto/checkout-shipping-quote.dto';

@Controller('public/commerce')
export class CommercePublicController {
  constructor(private readonly commerce: CommerceService) {}

  /** Cota frete estimado (postagem costureira → CEP do cliente) por linha do carrinho. */
  @Throttle({ default: { limit: 45, ttl: 60_000 } })
  @Post('shipping-quote')
  shippingQuote(@Body() body: CheckoutShippingQuoteDto) {
    return this.commerce.checkoutShippingQuote(body.cep_destino, body.lines);
  }
}
