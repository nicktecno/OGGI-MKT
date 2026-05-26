"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  productName: string;
  imageUrls: string[];
};

export function ProductPageGallery({ productName, imageUrls }: Props) {
  const slides = imageUrls.filter(Boolean);
  const [i, setI] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const n = slides.length;
  const safeIndex = n === 0 ? 0 : Math.min(i, n - 1);
  const current = slides[safeIndex] ?? "";

  const slidesKey = slides.join("|");
  useEffect(() => {
    setI(0);
  }, [slidesKey]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 1) return;
      setI((prev) => (prev + dir + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, go]);

  if (n === 0) {
    return (
      <div className="relative mx-auto flex aspect-[3/4] w-full max-w-[17.5rem] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground sm:max-w-xs lg:mx-0 lg:max-w-sm">
        Sem imagens
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[17.5rem] space-y-3 sm:max-w-xs lg:mx-0 lg:max-w-sm">
        <div className="group/hero relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm">
          <button
            type="button"
            className="relative block h-full w-full cursor-zoom-in text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Ampliar imagem ${safeIndex + 1} de ${n}`}
            onClick={() => setLightbox(true)}
          >
            <Image
              src={current}
              alt={`${productName} — foto ${safeIndex + 1}`}
              fill
              priority
              className="object-cover transition-transform duration-300 group-hover/hero:scale-[1.02]"
              sizes="(max-width: 640px) 280px, 384px"
            />
            <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
              <ZoomIn className="h-3.5 w-3.5" />
              Ampliar
            </span>
          </button>
          {n > 1 ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-border/60 bg-background/90 shadow-md"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-border/60 bg-background/90 shadow-md"
                aria-label="Foto seguinte"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>

        {n > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {slides.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setI(idx)}
                className={cn(
                  "relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  idx === safeIndex ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-75 hover:opacity-100",
                )}
                aria-label={`Miniatura ${idx + 1}`}
              >
                <Image src={url} alt="" fill className="object-cover" sizes="56px" unoptimized />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/92 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada"
        >
          <div className="mb-4 flex shrink-0 items-center justify-between gap-4 text-white">
            <p className="text-sm font-medium">
              {productName} · {safeIndex + 1}/{n}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="shrink-0 rounded-full"
              aria-label="Fechar"
              onClick={() => setLightbox(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative min-h-0 flex-1 overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element -- lightbox: zoom natural + URL externa */}
            <img
              src={current}
              alt={`${productName} — ampliada`}
              className="mx-auto max-h-[calc(100vh-8rem)] w-auto max-w-full cursor-zoom-out object-contain"
              onClick={() => setLightbox(false)}
            />
          </div>
          {n > 1 ? (
            <div className="mt-4 flex shrink-0 justify-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => go(-1)}>
                Anterior
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => go(1)}>
                Seguinte
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
