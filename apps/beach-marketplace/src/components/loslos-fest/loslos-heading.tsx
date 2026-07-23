import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  /** Faixa rosa no topo (estilo site Loslos) */
  band?: boolean;
};

export function LoslosHeading({ eyebrow, title, subtitle, className, band }: Props) {
  return (
    <header
      className={cn(
        band && "rounded-2xl bg-primary px-6 py-8 text-primary-foreground md:px-10 md:py-10",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-extrabold uppercase tracking-[0.35em]",
            band ? "text-primary-foreground/90" : "text-primary",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "mt-2 font-heading text-2xl font-extrabold uppercase leading-tight tracking-wide md:text-4xl",
          band ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            "mt-3 max-w-2xl text-base leading-relaxed md:text-lg",
            band ? "text-primary-foreground/90" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
