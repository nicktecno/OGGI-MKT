import { BadRequestException } from '@nestjs/common';

/** MIME permitidos para imagens de vitrine / galeria / insumo (bytes já comprimidos no cliente). */
export function marketplaceUploadContentType(mimeType: string): string {
  const m = mimeType.toLowerCase().split(';')[0]?.trim() ?? '';
  if (m === 'image/webp') return 'image/webp';
  if (m === 'image/jpeg' || m === 'image/jpg') return 'image/jpeg';
  throw new BadRequestException(
    'Formato de imagem não suportado. Use WebP ou JPEG (compressão no painel).',
  );
}
