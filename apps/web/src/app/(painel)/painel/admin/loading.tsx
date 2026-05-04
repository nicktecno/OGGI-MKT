"use client";

import { useEffect, useState } from "react";
import { LottieLoading } from "@/components/ui/lottie-loading";

/**
 * Transições entre rotas `/painel/admin/*`.
 * O Lottie só monta após hidratação — no boundary `loading` do App Router o
 * lottie-react costumava não pintar no primeiro paint (ficava só o texto).
 */
export default function AdminPainelLoading() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex h-[200px] w-full max-w-[320px] items-center justify-center">
        {ready ? (
          <LottieLoading height={180} className="shrink-0" />
        ) : (
          <div
            className="h-[180px] w-full max-w-[320px] animate-pulse rounded-lg bg-muted/40"
            aria-hidden
          />
        )}
      </div>
      <p className="text-sm text-muted-foreground">Carregando administração…</p>
    </div>
  );
}
