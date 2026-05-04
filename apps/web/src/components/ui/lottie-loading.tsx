"use client";

import Lottie from "lottie-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import rawAnimation from "@/assets/lottie/sewing-tools.json";

type LottieLoadingProps = {
  className?: string;
  /** Altura do player em px (largura proporcional ao JSON 1920×1080). */
  height?: number;
  loop?: boolean;
};

export function LottieLoading({ className, height = 96, loop = true }: LottieLoadingProps) {
  const animationData = useMemo(() => structuredClone(rawAnimation) as object, []);
  const width = Math.round(height * (1920 / 1080));

  return (
    <div
      className={cn("inline-flex items-center justify-center overflow-hidden", className)}
      style={{ minHeight: height, minWidth: Math.min(width, 320) }}
    >
      <Lottie
        animationData={animationData}
        loop={loop}
        renderer="svg"
        className="pointer-events-none [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-[min(100vw,320px)]"
        style={{ height, width: "auto", maxWidth: "min(100vw, 320px)" }}
      />
    </div>
  );
}
