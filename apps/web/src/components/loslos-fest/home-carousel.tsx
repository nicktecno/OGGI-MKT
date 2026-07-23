"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HOME_IMAGE_DEFAULTS } from "@/lib/loslos-fest/admin-catalog-storage";
import { useFestCatalog } from "@/lib/loslos-fest/use-fest-catalog";

export function HomeCarousel() {
  const catalog = useFestCatalog();
  const SLIDES =
    catalog.homeImages?.heroSlides?.length
      ? catalog.homeImages.heroSlides
      : HOME_IMAGE_DEFAULTS.heroSlides;

  const [current, setCurrent] = useState(0);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length),
    [SLIDES.length],
  );
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % SLIDES.length),
    [SLIDES.length],
  );

  useEffect(() => {
    if (current > SLIDES.length - 1) setCurrent(0);
  }, [current, SLIDES.length]);

  useEffect(() => {
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-primary/20">
      <div className="relative aspect-video">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === current ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Próximo slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all",
              i === current ? "w-6 bg-white" : "w-2 bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
