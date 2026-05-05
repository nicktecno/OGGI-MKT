"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressImageForUpload, type CompressImageMime } from "@/lib/compress-image-client";
import {
  acceptAttributeForImageInput,
  IMAGE_UPLOAD_LIMITS,
} from "@/lib/image-upload-limits";
import { cn } from "@/lib/utils";

export type ImageUploadFieldProps = {
  label?: string;
  description?: string;
  className?: string;
  /** Desativa o input (ex.: API / R2 não configurados). */
  disabled?: boolean;
  /** Chamado após compressão bem-sucedida (ex.: FormData.append ou upload S3) */
  onPrepared?: (payload: {
    blob: Blob;
    filename: string;
    mimeType: CompressImageMime;
    originalSizeBytes: number;
    outputSizeBytes: number;
    outputWidth: number;
    outputHeight: number;
  }) => void;
  /** Chamado quando o utilizador limpa a pré-visualização (ex.: anular imagem opcional antes de criar a peça). */
  onCleared?: () => void;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploadField({
  label = "Imagem",
  description = `JPEG, PNG ou WebP · até ${Math.round(IMAGE_UPLOAD_LIMITS.maxOriginalFileBytes / (1024 * 1024))} MB · comprimimos no navegador (WebP ou JPEG · ~máx. ${formatBytes(IMAGE_UPLOAD_LIMITS.maxOutputFileBytes)}).`,
  className,
  disabled = false,
  onPrepared,
  onCleared,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const previewRef = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      setError(null);
      setInfo(null);
      revokePreview();
      if (!file) return;
      if (disabled) return;

      setBusy(true);
      try {
        const result = await compressImageForUpload(file);
        if (!result.ok) {
          if ("validation" in result) {
            setError(result.validation.message);
          } else {
            setError(result.error);
          }
          return;
        }

        const url = URL.createObjectURL(result.blob);
        previewRef.current = url;
        setPreviewUrl(url);
        setInfo(
          `${result.originalWidth}×${result.originalHeight}px → ${result.outputWidth}×${result.outputHeight}px · ${formatBytes(result.originalSizeBytes)} → ${formatBytes(result.outputSizeBytes)}`,
        );
        onPrepared?.({
          blob: result.blob,
          filename: result.filename,
          mimeType: result.mimeType,
          originalSizeBytes: result.originalSizeBytes,
          outputSizeBytes: result.outputSizeBytes,
          outputWidth: result.outputWidth,
          outputHeight: result.outputHeight,
        });
      } finally {
        setBusy(false);
      }
    },
    [disabled, onPrepared, revokePreview],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Label htmlFor={inputId}>{label}</Label>
        <input
          id={inputId}
          type="file"
          accept={acceptAttributeForImageInput()}
          disabled={disabled || busy}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
          onChange={(e) => {
            const f = e.target.files?.[0];
            void onFile(f);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {busy ? (
        <p className="text-sm text-muted-foreground">Otimizando imagem…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {info && !error ? <p className="text-xs text-muted-foreground">{info}</p> : null}

      {previewUrl ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pré-visualização
          </p>
          {/* blob: URLs não passam pelo otimizador Next */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Pré-visualização do upload"
            className="max-h-48 max-w-full rounded-md border border-border object-contain"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              revokePreview();
              setInfo(null);
              onCleared?.();
            }}
          >
            Limpar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
