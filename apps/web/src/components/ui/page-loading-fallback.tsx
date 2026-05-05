"use client";

import { cn } from "@/lib/utils";
import { LottieLoading } from "./lottie-loading";

type PageLoadingFallbackProps = {
  className?: string;
  /** Altura do indicador em px (ex.: 180 página inteira, 72 embutido). */
  indicatorHeight?: number;
  /** Se definido, mostra texto abaixo do indicador; caso contrário só leitor de telas. */
  visibleMessage?: string | null;
};

/**
 * Fallback padrão para `loading.tsx` e `Suspense` — sempre mostra o mesmo indicador visual.
 */
export function PageLoadingFallback({
  className,
  indicatorHeight = 180,
  visibleMessage = null,
}: PageLoadingFallbackProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 px-4", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex min-h-[5.5rem] w-full max-w-[320px] items-center justify-center">
        <LottieLoading height={indicatorHeight} className="shrink-0" />
      </div>
      {visibleMessage ? (
        <p className="text-center text-sm text-muted-foreground">{visibleMessage}</p>
      ) : (
        <span className="sr-only">Carregando</span>
      )}
    </div>
  );
}
