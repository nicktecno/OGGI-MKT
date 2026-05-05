"use client";

import { cn } from "@/lib/utils";

type LottieLoadingProps = {
  className?: string;
  /** Altura em px; o anel escala proporcionalmente. */
  height?: number;
  /** @deprecated ignorado — mantido para compatibilidade com chamadas antigas. */
  loop?: boolean;
};

/**
 * Indicador de carregamento padrão da aplicação (anéis em CSS).
 * Se existir `public/loading/sewing-tools.webm`, pode ser reativado como camada extra no futuro.
 */
export function LottieLoading({ className, height = 96 }: LottieLoadingProps) {
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
