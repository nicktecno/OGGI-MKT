import Image from "next/image";
import type { IceCreamLine } from "@/lib/oggi-fest/types";
import { formatBrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  line: IceCreamLine;
  className?: string;
  /** Modo compacto para listas no configurador */
  compact?: boolean;
};

export function IceCreamLineCard({ line, className, compact }: Props) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border-2 border-primary/15 bg-card shadow-sm transition hover:border-primary/40 hover:shadow-md",
        className,
      )}
    >
      <div className={cn("relative bg-[#0f1a1b]", compact ? "aspect-square" : "aspect-[4/5]")}>
        <Image
          src={line.imageUrl}
          alt={line.name}
          fill
          className="object-contain p-2"
          sizes={compact ? "80px" : "(max-width:768px) 50vw, 25vw"}
        />
      </div>
      <div className={cn("border-t border-primary/15 bg-card", compact ? "p-3" : "p-4")}>
        <h3
          className={cn(
            "font-heading font-extrabold uppercase tracking-wide text-primary",
            compact ? "text-xs" : "text-sm md:text-base",
          )}
        >
          {line.name}
        </h3>
        {!compact ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{line.description}</p>
        ) : null}
        <p className={cn("font-bold text-primary", compact ? "mt-1 text-sm" : "mt-2 text-base")}>
          {formatBrl(line.unitPrice)}
          <span className="text-xs font-semibold text-muted-foreground"> / un.</span>
        </p>
      </div>
    </article>
  );
}
