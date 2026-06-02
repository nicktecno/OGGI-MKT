"use client";

import { cn } from "@/lib/utils";

type Props = {
  filled: number;
  capacity: number;
  className?: string;
};

export function CapacityBar({ filled, capacity, className }: Props) {
  const pct = capacity > 0 ? Math.min(100, (filled / capacity) * 100) : 0;
  const complete = filled >= capacity;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {filled} / {capacity} unidades
        </span>
        <span className={cn("text-muted-foreground", complete && "font-medium text-accent")}>
          {complete ? "Carrinho completo" : `${capacity - filled} restantes`}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            complete ? "bg-[#ffc72c]" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
