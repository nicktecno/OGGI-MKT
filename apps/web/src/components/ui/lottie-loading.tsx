"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

/** Vídeo em `public/loading/sewing-tools.webm` — copie o arquivo .webm que você enviou para esta pasta. */
export const LOADING_VIDEO_SRC = "/loading/sewing-tools.webm";

type LottieLoadingProps = {
  className?: string;
  /** Altura em px; o vídeo mantém proporção. */
  height?: number;
  loop?: boolean;
};

function CssRingsFallback({ className, height }: { className?: string; height: number }) {
  const outer = Math.max(height < 40 ? 18 : 22, Math.round(height * 0.44));
  const inner = Math.max(12, Math.round(outer * 0.52));
  const box = Math.max(outer + 10, Math.round(height * 1.08));

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{
        minHeight: height,
        width: box,
        maxWidth: "min(100vw, 320px)",
      }}
      aria-hidden
    >
      <div
        className="absolute rounded-full border-2 border-muted/55 border-t-accent border-r-accent/55 shadow-sm ring-2 ring-accent/10 animate-spin"
        style={{ width: outer, height: outer }}
      />
      <div
        className="absolute rounded-full border border-muted/40 border-b-accent/80 animate-spin shadow-inner [animation-duration:1.15s] [animation-direction:reverse]"
        style={{ width: inner, height: inner }}
      />
    </div>
  );
}

/**
 * Indicador de carregamento padrão: reproduz o WebM em loop.
 * Se o arquivo não existir ou o vídeo falhar, usa anéis em CSS como reserva.
 */
export function LottieLoading({ className, height = 96, loop = true }: LottieLoadingProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const onVideoError = useCallback(() => setVideoFailed(true), []);

  if (videoFailed) {
    return <CssRingsFallback className={className} height={height} />;
  }

  return (
    <div
      className={cn("inline-flex items-center justify-center overflow-hidden", className)}
      style={{
        minHeight: height,
        minWidth: Math.min(Math.round(height * (16 / 9)), 320),
        maxWidth: "min(100vw, 320px)",
      }}
      aria-hidden
    >
      <video
        src={LOADING_VIDEO_SRC}
        className="pointer-events-none block h-full max-h-full w-full object-contain"
        style={{ height, width: "auto", maxWidth: "min(100vw, 320px)" }}
        autoPlay
        muted
        loop={loop}
        playsInline
        preload="auto"
        onError={onVideoError}
      />
    </div>
  );
}
