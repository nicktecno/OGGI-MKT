import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CatalogRow } from "@/lib/demo-seed";
import { formatBrl } from "@/lib/utils";

type CatalogProductGridProps = {
  rows: CatalogRow[];
  /** Conteúdo quando não há linhas (busca vazia ou catálogo vazio). */
  emptyContent: ReactNode;
  /** Densidade do grid. */
  columns?: "2-3" | "2-4";
};

export function CatalogProductGrid({
  rows,
  emptyContent,
  columns = "2-3",
}: CatalogProductGridProps) {
  if (rows.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">{emptyContent}</div>;
  }

  const gridClass =
    columns === "2-4"
      ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid gap-8 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <ul className={gridClass}>
      {rows.map(({ listing, product }) => (
        <li key={listing.id}>
          <Link
            href={`/loja/produto/${product.slug}`}
            className="group block h-full rounded-2xl outline-none ring-offset-background focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <Card className="flex h-full flex-col overflow-hidden border-border/50 bg-card transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-luxury">
              <div className="relative aspect-[3/4] border-b border-border/50">
                <Image
                  src={product.imagem_url}
                  alt={product.nome}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
                  Em estoque
                </span>
              </div>
              <CardHeader className="flex-1 space-y-1 pb-2 pt-4">
                <CardTitle className="font-serif text-lg leading-snug transition-colors group-hover:text-accent md:text-xl">
                  {product.nome}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-[0.8125rem] leading-relaxed">
                  {product.descricao_curta}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3 pb-4 pt-0">
                <p className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {formatBrl(product.preco_venda_publico)}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground/90">{listing.available_quantity}</span>{" "}
                  disponíve{listing.available_quantity === 1 ? "l" : "is"} · {listing.executorNome}
                </p>
                <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  {listing.cidade_origem} · CEP {listing.cep_origem}
                </p>
              </CardContent>
              <CardFooter className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 bg-muted/25 py-3">
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  {product.sku}
                </span>
                <span className="text-sm font-medium text-accent transition-colors group-hover:text-accent/90">
                  Ver peça →
                </span>
              </CardFooter>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
