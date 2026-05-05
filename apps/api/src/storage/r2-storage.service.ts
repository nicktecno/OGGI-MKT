import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

/** Cloudflare R2 (API compatível com S3). Plano gratuito: ver documentação R2. */
@Injectable()
export class R2StorageService {
  private readonly log = new Logger(R2StorageService.name);

  isConfigured(): boolean {
    return Boolean(
      process.env.R2_ACCOUNT_ID?.trim() &&
        process.env.R2_ACCESS_KEY_ID?.trim() &&
        process.env.R2_SECRET_ACCESS_KEY?.trim() &&
        process.env.R2_BUCKET_NAME?.trim() &&
        process.env.R2_PUBLIC_BASE_URL?.trim(),
    );
  }

  private client(): S3Client {
    const accountId = process.env.R2_ACCOUNT_ID!.trim();
    return new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
      },
    });
  }

  /**
   * Envia bytes públicos (ex.: imagem WebP) e devolve a URL pública de leitura.
   * `R2_PUBLIC_BASE_URL` deve ser a URL pública do bucket (ex.: https://pub-xxx.r2.dev ou domínio customizado).
   */
  async putPublicObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<string> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Armazenamento de imagens (Cloudflare R2) não está configurado no servidor. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME e R2_PUBLIC_BASE_URL.',
      );
    }
    const bucket = process.env.R2_BUCKET_NAME!.trim();
    const base = process.env.R2_PUBLIC_BASE_URL!.trim().replace(/\/$/, '');
    const key = params.key.replace(/^\//, '');

    await this.client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: params.body,
        ContentType: params.contentType,
        CacheControl: params.cacheControl ?? 'public, max-age=31536000, immutable',
      }),
    );

    const url = `${base}/${key}`;
    this.log.log(`R2 PutObject ok: ${key}`);
    return url;
  }

  /** Caminho estável por produto + ficheiro único (substituições não apagam o antigo; podes configurar lifecycle no R2). */
  marketplaceProductImageKey(productId: string): string {
    const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, '');
    return `marketplace/products/${safeId}/${randomUUID()}.webp`;
  }

  marketplaceProductGalleryImageKey(productId: string): string {
    const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, '');
    return `marketplace/products/${safeId}/gallery/${randomUUID()}.webp`;
  }

  supplyItemImageKey(supplyItemId: string): string {
    const safeId = supplyItemId.replace(/[^a-zA-Z0-9_-]/g, '');
    return `marketplace/supply-items/${safeId}/${randomUUID()}.webp`;
  }
}
