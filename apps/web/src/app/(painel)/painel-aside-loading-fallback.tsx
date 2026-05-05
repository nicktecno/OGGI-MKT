"use client";

import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";

/** Enquanto a sidebar (contagens admin / estado da loja) carrega no servidor. */
export function PainelAsideLoadingFallback() {
  return (
    <PageLoadingFallback
      className="min-h-[12rem] py-6 md:min-h-0 md:flex-1 md:py-4"
      indicatorHeight={88}
    />
  );
}
