"use client";

import { LottieLoadingBoundary } from "@/components/ui/lottie-loading-boundary";

/** Fallback enquanto as páginas assíncronas do admin carregam (Suspense no layout). */
export function AdminSectionFallback() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex h-[200px] w-full max-w-[320px] items-center justify-center">
        <LottieLoadingBoundary height={180} className="shrink-0" />
      </div>
      <p className="text-sm text-muted-foreground">Carregando administração…</p>
    </div>
  );
}
