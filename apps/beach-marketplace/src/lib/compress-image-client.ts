"use client";

import {
  IMAGE_UPLOAD_LIMITS,
  validateImageFileBeforeProcess,
  type ImageUploadValidationResult,
} from "./image-upload-limits";

export type CompressImageMime = "image/webp" | "image/jpeg";

export type CompressImageResult =
  | {
      ok: true;
      blob: Blob;
      filename: string;
      /** MIME do blob (WebP ou JPEG, conforme suporte do browser). */
      mimeType: CompressImageMime;
      originalWidth: number;
      originalHeight: number;
      outputWidth: number;
      outputHeight: number;
      originalSizeBytes: number;
      outputSizeBytes: number;
    }
  | { ok: false; validation: ImageUploadValidationResult & { ok: false } }
  | { ok: false; error: string };

function extensionFromName(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function baseNameWithoutExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

/** `canvas.toBlob('image/webp')` devolve `null` em browsers sem codificador WebP (ex.: Safari antigo). */
async function canEncodeWebpOnCanvas(): Promise<boolean> {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, 16, 16);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", 0.85);
  });
  return blob !== null && blob.size > 0;
}

const ENCODE_FAIL = "Falha ao gerar imagem comprimida.";

async function encodePipeline(
  bitmap: ImageBitmap,
  file: File,
  outputMime: CompressImageMime,
): Promise<CompressImageResult> {
  const {
    maxDecodedEdgePx,
    targetMaxEdgePx,
    targetMinEdgePx,
    maxOutputFileBytes,
    webpQualityInitial,
    webpQualityMin,
  } = IMAGE_UPLOAD_LIMITS;

  const ow = bitmap.width;
  const oh = bitmap.height;
  if (ow > maxDecodedEdgePx || oh > maxDecodedEdgePx) {
    return {
      ok: false,
      validation: {
        ok: false,
        code: "DIMENSIONS",
        message: `Imagem muito grande (${ow}×${oh}px). Máximo ${maxDecodedEdgePx}px por lado.`,
      },
    };
  }

  let targetEdge = Math.min(targetMaxEdgePx, Math.max(ow, oh));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { ok: false, error: "Canvas não disponível neste ambiente." };
  }

  const tryEncode = (w: number, h: number, quality: number): Promise<Blob | null> =>
    new Promise((resolve) => {
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(bitmap, 0, 0, w, h);
      canvas.toBlob((b) => resolve(b), outputMime, quality);
    });

  let outW = ow;
  let outH = oh;
  let blob: Blob | null = null;

  outer: while (targetEdge >= targetMinEdgePx) {
    const scale = Math.min(1, targetEdge / Math.max(ow, oh));
    outW = Math.max(1, Math.round(ow * scale));
    outH = Math.max(1, Math.round(oh * scale));

    let hi: number = webpQualityInitial;
    let lo: number = webpQualityMin;
    blob = await tryEncode(outW, outH, hi);
    if (!blob) break outer;
    if (blob.size <= maxOutputFileBytes) break outer;

    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      const b = await tryEncode(outW, outH, mid);
      if (!b) break;
      if (b.size <= maxOutputFileBytes) {
        blob = b;
        hi = mid;
      } else {
        lo = mid;
      }
    }

    if (blob.size <= maxOutputFileBytes) break outer;

    targetEdge = Math.floor(targetEdge * 0.88);
  }

  if (!blob || blob.size === 0) {
    return { ok: false, error: ENCODE_FAIL };
  }
  if (blob.size > maxOutputFileBytes) {
    return {
      ok: false,
      error: `Não foi possível ficar abaixo de ${Math.round(maxOutputFileBytes / (1024 * 1024))} MB. Experimente uma foto com menos detalhe ou resolução menor.`,
    };
  }

  const ext = extensionFromName(file.name);
  const base =
    ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp"
      ? baseNameWithoutExt(file.name)
      : "imagem";
  const suffix = outputMime === "image/webp" ? "webp" : "jpg";
  const filename = `${base || "imagem"}.${suffix}`;

  return {
    ok: true,
    blob,
    filename,
    mimeType: outputMime,
    originalWidth: ow,
    originalHeight: oh,
    outputWidth: outW,
    outputHeight: outH,
    originalSizeBytes: file.size,
    outputSizeBytes: blob.size,
  };
}

/**
 * Redimensiona (se precisar) e exporta WebP com qualidade ajustada para ficar abaixo do teto de bytes.
 * Em browsers sem `toBlob` WebP, usa JPEG (a API aceita ambos).
 */
export async function compressImageForUpload(file: File): Promise<CompressImageResult> {
  const pre = validateImageFileBeforeProcess(file);
  if (!pre.ok) return { ok: false, validation: pre };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    return {
      ok: false,
      validation: {
        ok: false,
        code: "DECODE",
        message: "Não foi possível ler a imagem. Tente outro arquivo.",
      },
    };
  }

  try {
    const webpOk = await canEncodeWebpOnCanvas();
    const primary: CompressImageMime = webpOk ? "image/webp" : "image/jpeg";
    let result = await encodePipeline(bitmap, file, primary);

    if (
      !result.ok &&
      "error" in result &&
      result.error === ENCODE_FAIL &&
      primary === "image/webp"
    ) {
      result = await encodePipeline(bitmap, file, "image/jpeg");
    }

    return result;
  } finally {
    bitmap.close();
  }
}
