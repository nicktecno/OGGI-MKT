"use client";

import { LottieLoading } from "@/components/ui/lottie-loading";

/** Transições entre rotas `/painel/admin/*` enquanto a página assíncrona carrega. */
export default function AdminPainelLoading() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LottieLoading height={180} />
      <p className="text-sm text-muted-foreground">Carregando administração…</p>
    </div>
  );
}
