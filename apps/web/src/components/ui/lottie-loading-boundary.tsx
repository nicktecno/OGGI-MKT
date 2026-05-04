"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import rawAnimation from "@/assets/lottie/sewing-tools.json";

type LottieLoadingBoundaryProps = {
  className?: string;
  /** Altura em px (proporção 1920×1080). */
  height?: number;
};

/**
 * Lottie para `loading.tsx` / Suspense fallbacks no App Router.
 * Usa `lottie-web` de forma imperativa — `lottie-react` costuma não pintar nestes boundaries.
 */
export function LottieLoadingBoundary({ className, height = 180 }: LottieLoadingBoundaryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: { destroy: () => void } | null = null;
    let cancelled = false;
    const animationData = structuredClone(rawAnimation) as object;

    void import("lottie-web").then((lottie) => {
      if (cancelled) return;
      const target = containerRef.current;
      if (!target) return;
      anim = lottie.default.loadAnimation({
        container: target,
        renderer: "svg",
        loop: true,
        animationData,
      });
    });

    return () => {
      cancelled = true;
      anim?.destroy();
      anim = null;
    };
  }, []);

  const width = Math.round(height * (1920 / 1080));

  return (
    <div
      ref={containerRef}
      className={cn("mx-auto flex items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full", className)}
      style={{
        height,
        width: Math.min(width, 320),
        minHeight: height,
        minWidth: Math.min(width, 200),
      }}
    />
  );
}
