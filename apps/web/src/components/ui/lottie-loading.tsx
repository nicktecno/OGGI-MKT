"use client";

import { cn } from "@/lib/utils";

/** Vídeo servido de `public/loading/sewing-tools.webm` (evita problemas do Lottie no App Router). */
const LOADING_VIDEO_SRC = "/loading/sewing-tools.webm";

type LottieLoadingProps = {
  className?: string;
  /** Altura em px; largura limitada proporcionalmente. */
  height?: number;
  /** Mantido por compatibilidade com chamadas antigas; o vídeo repete em loop. */
  loop?: boolean;
};

export function LottieLoading({ className, height = 96, loop = true }: LottieLoadingProps) {
  const aspect = 16 / 9;
  const width = Math.round(height * aspect);

  return (
    <div
      className={cn("inline-flex items-center justify-center overflow-hidden", className)}
      style={{ minHeight: height, minWidth: Math.min(width, 320), maxWidth: "min(100vw, 320px)" }}
    >
      <video
        src={LOADING_VIDEO_SRC}
        className="pointer-events-none block h-full max-h-full w-full object-contain"
        style={{ height, width: "auto", maxWidth: "min(100vw, 320px)" }}
        autoPlay
        muted
        loop={loop}
        playsInline
        preload="metadata"
        aria-hidden
      />
    </div>
  );
}
