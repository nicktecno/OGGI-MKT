import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";

/** Fallback enquanto as páginas assíncronas do admin carregam (Suspense no layout). */
export function AdminSectionFallback() {
  return <PageLoadingFallback className="min-h-[40vh] py-8" />;
}
