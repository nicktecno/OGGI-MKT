import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { CatalogRow } from "@/lib/demo-seed";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CatalogProductGrid } from "./catalog-product-grid";

type FeaturedProductsSectionProps = {
  rows: CatalogRow[];
  /** Âncora para scroll (home vs loja). */
  sectionId?: string;
  /** Texto do selo acima do título. */
  eyebrow?: string;
  /** Mostrar link para catálogo completo (home). */
  showViewAll?: boolean;
  /** Colunas do grid de produtos. */
  gridColumns?: "2-3" | "2-4";
};

export function FeaturedProductsSection({
  rows,
  sectionId = "em-destaque",
  eyebrow = "Vitrine ao vivo",
  showViewAll = true,
  gridColumns = "2-3",
}: FeaturedProductsSectionProps) {
  return (
    <section
      id={sectionId}
      className="relative scroll-mt-28 border-b border-border/60 bg-gradient-to-b from-card/90 via-background to-background py-20 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,oklch(0.5_0.1_48_/_0.07),transparent_65%)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-6 border-b border-border/40 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.38em] text-accent">{eyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight md:text-4xl md:tracking-[-0.02em]">
              Em destaque
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
              Peças com estoque publicado agora — escolha, adicione ao carrinho e finalize em poucos passos.
            </p>
          </div>
          {showViewAll ? (
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/loja"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-foreground/12 bg-background/60 backdrop-blur-sm",
                )}
              >
                Ver vitrine completa
              </Link>
              <Link href="/carrinho" className={cn(buttonVariants({ size: "lg" }))}>
                Ir ao carrinho
              </Link>
            </div>
          ) : null}
        </div>

        <CatalogProductGrid
          rows={rows}
          columns={gridColumns}
          emptyContent={
            <>
              Nenhuma oferta publicada no momento.{" "}
              <Link href="/loja" className="font-medium text-accent underline-offset-4 hover:underline">
                Atualize a página da loja
              </Link>{" "}
              ou volte em breve.
            </>
          }
        />

        <p className="mt-14 text-center text-sm text-muted-foreground md:text-base">
          Compra segura · curadoria {SITE_NAME} · novidades entram conforme as costureiras publicam
        </p>
      </div>
    </section>
  );
}
