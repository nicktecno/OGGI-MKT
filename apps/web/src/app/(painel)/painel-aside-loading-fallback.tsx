"use client";

import { LottieLoading } from "@/components/ui/lottie-loading";

/** Enquanto a sidebar (contagens admin / estado da loja) carrega no servidor. */
export function PainelAsideLoadingFallback() {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 py-6 md:min-h-0 md:flex-1">
      <LottieLoading height={100} />
      <p className="text-center text-xs text-muted-foreground">Carregando…</p>
    </div>
  );
}
