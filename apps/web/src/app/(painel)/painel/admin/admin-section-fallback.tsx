import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";

/** Fallback enquanto as páginas assíncronas do admin carregam (Suspense no layout). */
export function AdminSectionFallback() {
  return (
    <PageLoadingFallback
      className="min-h-[36vh] py-6 sm:min-h-[32vh]"
      indicatorHeight={100}
      visibleMessage="A carregar esta secção…"
    />
  );
}
