import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";

/** Transições entre rotas `/painel/...` enquanto a página assíncrona prepara o HTML. */
export default function PainelRoutesLoading() {
  return <PageLoadingFallback className="min-h-[40vh] py-12" />;
}
