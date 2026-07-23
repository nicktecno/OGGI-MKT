/**
 * Limites para uploads de imagem (cliente + validação compartilhada).
 * Compressão em `compress-image-client.ts` — usar só em componentes client.
 */

export const IMAGE_UPLOAD_LIMITS = {
  /** Tipos aceitos no `<input accept>` e na validação */
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const,

  /** Tamanho máximo do arquivo original antes de processar (evita travar o browser) */
  maxOriginalFileBytes: 15 * 1024 * 1024,

  /** Lado máximo permitido na decodificação (proteção contra “imagens bomba” em pixels) */
  maxDecodedEdgePx: 8192,

  /** Maior lado da imagem após redimensionamento (px) */
  targetMaxEdgePx: 1920,

  /** Se ainda estiver grande demais, reduzimos o lado alvo até este mínimo */
  targetMinEdgePx: 480,

  /** Teto do arquivo final (após compressão), em bytes — máximo 1 MiB para envio */
  maxOutputFileBytes: 1024 * 1024,

  /** Qualidade WebP inicial e mínima na busca binária */
  webpQualityInitial: 0.88,
  webpQualityMin: 0.55,
} as const;

export type ImageUploadValidationErrorCode =
  | "TYPE"
  | "SIZE"
  | "DIMENSIONS"
  | "DECODE";

export type ImageUploadValidationResult =
  | { ok: true }
  | { ok: false; code: ImageUploadValidationErrorCode; message: string };

export function validateImageFileBeforeProcess(file: File): ImageUploadValidationResult {
  const { allowedMimeTypes, maxOriginalFileBytes } = IMAGE_UPLOAD_LIMITS;
  const type = file.type.toLowerCase();
  if (!allowedMimeTypes.includes(type as (typeof allowedMimeTypes)[number])) {
    return {
      ok: false,
      code: "TYPE",
      message: "Use JPEG, PNG ou WebP.",
    };
  }
  if (file.size > maxOriginalFileBytes) {
    return {
      ok: false,
      code: "SIZE",
      message: `Arquivo muito grande (máx. ${Math.round(maxOriginalFileBytes / (1024 * 1024))} MB).`,
    };
  }
  return { ok: true };
}

export function acceptAttributeForImageInput(): string {
  return IMAGE_UPLOAD_LIMITS.allowedMimeTypes.join(",");
}
