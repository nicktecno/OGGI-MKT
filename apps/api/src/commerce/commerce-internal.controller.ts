import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import type { Express } from 'express';
import { CommerceService } from './commerce.service';
import { InternalApiGuard } from './internal-api.guard';

@Controller('internal/commerce')
@UseGuards(InternalApiGuard)
@SkipThrottle()
export class CommerceInternalController {
  constructor(private readonly commerce: CommerceService) {}

  @Get('state')
  getState() {
    return this.commerce.getState();
  }

  /** Cria produto composto (montagem com insumos). */
  @Post('products')
  createProduct(
    @Body()
    body: {
      nome: string;
      slug?: string;
      sku: string;
      descricao_curta: string;
      linhas: { supply_item_id: string; quantidade: number }[];
      variacoes_tamanho: string[];
      preco_venda_publico?: number;
      executor_fee_planejada?: number;
      platform_fee_planejada?: number;
    },
  ) {
    return this.commerce.createCompositeProduct(body);
  }

  /**
   * Cria peça e opcionalmente define a capa da vitrine no mesmo pedido (multipart).
   * Evita janela em que a listagem ainda mostra a imagem placeholder.
   */
  @Post('products/with-cover')
  @UseInterceptors(
    FileInterceptor('cover', {
      limits: { fileSize: 1024 * 1024 },
    }),
  )
  createProductWithCover(
    @Body('payload') payloadJson: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 })],
      }),
    )
    cover: Express.Multer.File | undefined,
  ) {
    if (typeof payloadJson !== 'string' || !payloadJson.trim()) {
      throw new BadRequestException('Campo payload (JSON da peça) é obrigatório.');
    }
    let body: {
      nome: string;
      slug?: string;
      sku: string;
      descricao_curta: string;
      linhas: { supply_item_id: string; quantidade: number }[];
      variacoes_tamanho: string[];
      preco_venda_publico?: number;
      executor_fee_planejada?: number;
      platform_fee_planejada?: number;
    };
    try {
      body = JSON.parse(payloadJson) as typeof body;
    } catch {
      throw new BadRequestException('Campo payload deve ser JSON válido.');
    }
    return this.commerce.createCompositeProduct(
      body,
      cover?.buffer?.length
        ? { buffer: cover.buffer, mimeType: cover.mimetype || 'application/octet-stream' }
        : undefined,
    );
  }

  @Patch('products/:id')
  patchProduct(
    @Param('id') id: string,
    @Body()
    body: {
      ativo?: boolean;
      admin_pausado?: boolean;
      preco_venda_publico?: number;
      executor_fee_planejada?: number;
      platform_fee_planejada?: number;
      pacote_altura_cm?: number;
      pacote_largura_cm?: number;
      pacote_comprimento_cm?: number;
      pacote_peso_kg?: number;
    },
  ) {
    return this.commerce.patchProduct(id, body);
  }

  /** Imagem da vitrine (WebP ou JPEG, máx. 1 MB) → Cloudflare R2 + atualização da peça. */
  @Post('products/:id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1024 * 1024 },
    }),
  )
  uploadProductImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.commerce.uploadProductImage(id, file.buffer, file.mimetype);
  }

  @Post('products/:id/gallery-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1024 * 1024 },
    }),
  )
  uploadProductGalleryImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.commerce.uploadProductGalleryImage(id, file.buffer, file.mimetype);
  }

  @Post('products/:id/gallery-remove')
  removeProductGalleryImage(@Param('id') id: string, @Body() body: { url: string }) {
    return this.commerce.removeProductGalleryImage(id, body.url ?? '');
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.commerce.deleteCompositeProduct(id);
  }

  @Post('execution-requests')
  createExecutionRequest(
    @Body()
    body: {
      compositeProductId: string;
      executorEmail: string;
      executorNome: string;
    },
  ) {
    return this.commerce.createPendingExecutionRequest(body);
  }

  @Post('execution-requests/:id/approve')
  approveRequest(@Param('id') id: string) {
    return this.commerce.approveExecutionRequest(id);
  }

  @Post('execution-requests/:id/reject')
  rejectRequest(@Param('id') id: string, @Body() body: { rejection_reason?: string }) {
    return this.commerce.rejectExecutionRequest(id, body.rejection_reason ?? '');
  }

  @Post('assignments')
  createAssignment(
    @Body()
    body: {
      compositeProductId: string;
      executorEmail: string;
      executorNome: string;
      cidade_origem: string;
      cep_origem: string;
    },
  ) {
    return this.commerce.createDirectAssignment(body);
  }

  @Post('assignments/:id/archive')
  archiveAssignment(@Param('id') id: string) {
    return this.commerce.archiveAssignment(id);
  }

  /** Ordem no carrossel de destaque da loja (admin). */
  @Patch('assignments/:id/storefront-highlight')
  patchAssignmentStorefrontHighlight(
    @Param('id') id: string,
    @Body() body: { storefront_highlight_order: number | null },
  ) {
    return this.commerce.patchAssignmentStorefrontHighlight(id, body);
  }

  @Post('assignments/:id/publish')
  publishAssignment(
    @Param('id') id: string,
    @Body() body: { available_quantity: number },
  ) {
    return this.commerce.publishAssignment(id, body);
  }
}
