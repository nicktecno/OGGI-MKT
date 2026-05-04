"use client";

import { LottieLoading } from "@/components/ui/lottie-loading";

export default function PublicLoading() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LottieLoading height={180} />
      <p className="text-sm text-muted-foreground">Carregando…</p>
    </div>
  );
}
