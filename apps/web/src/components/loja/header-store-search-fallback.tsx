"use client";

import { LottieLoading } from "@/components/ui/lottie-loading";

/** Fallback do `Suspense` do campo de pesquisa da loja (header). */
export function HeaderStoreSearchFallback() {
  return (
    <div
      className="flex h-9 w-full items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-muted/20 sm:max-w-xl"
      aria-hidden
    >
      <LottieLoading height={36} />
    </div>
  );
}
