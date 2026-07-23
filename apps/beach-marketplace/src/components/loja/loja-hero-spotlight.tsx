"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CatalogRow } from "@/lib/demo-seed";
import { cn, formatBrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AUTO_MS = 8500;

type Props = {
  rows: CatalogRow[];
};

export function LojaHeroSpotlight({ rows }: Props) {
  const [i, setI] = useState(0);
  const n = rows.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      setI((prev) => (prev + dir + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (n <= 1) return;
    const t = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(t);
  }, [n, go]);

  if (n === 0) return null;

  const single = n === 1;

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques da vitrine"
      className={cn(
        "group/slide relative overflow-hidden rounded-2xl border border-border/50 shadow-luxury-sm ring-1 ring-foreground/[0.04]",
        !single && "touch-pan-y",
      )}
    >
      <div className="relative aspect-[4/3] lg:aspect-[16/10]">
        {rows.map((row, idx) => {
          const active = idx === i;
          return (
            <Link
              key={row.listing.id}
              href={`/loja/produto/${row.product.slug}`}
              className={cn(
                "absolute inset-0 block outline-none transition-opacity duration-500 ease-out",
                active ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none",
              )}
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
            >
              <Image
                src={row.product.imagem_url}
                alt={row.product.nome}
                fill
                className="object-cover transition-transform duration-500 group-hover/slide:scale-[1.02]"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority={idx === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-accent">
                  Destaque da vitrine
                  {!single ? (
                    <span className="sr-only">
                      {" "}
                      ({idx + 1} de {n})
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 font-serif text-xl font-medium text-foreground md:text-2xl">
                  {row.product.nome}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{row.listing.executorNome}</p>
                <p className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground">
                  {formatBrl(row.product.preco_venda_publico)}
                </p>
                <span className="mt-3 inline-flex text-sm font-medium text-accent underline-offset-4 group-hover/slide:underline">
                  Ver detalhes e comprar →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {!single ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center gap-1.5 md:bottom-24">
            {rows.map((row, idx) => (
              <button
                key={row.listing.id}
                type="button"
                tabIndex={-1}
                className={cn(
                  "pointer-events-auto h-2 rounded-full transition-all duration-300",
                  idx === i ? "w-7 bg-primary" : "w-2 bg-foreground/25 hover:bg-foreground/40",
                )}
                aria-label={`Ir para slide ${idx + 1}`}
                aria-current={idx === i}
                onClick={() => setI(idx)}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-border/60 bg-background/85 shadow-md backdrop-blur-sm md:left-4"
            aria-label="Slide anterior"
            onClick={(e) => {
              e.preventDefault();
              go(-1);
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-border/60 bg-background/85 shadow-md backdrop-blur-sm md:right-4"
            aria-label="Slide seguinte"
            onClick={(e) => {
              e.preventDefault();
              go(1);
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      ) : null}
    </div>
  );
}
