"use client";

import { IceCreamLineCard } from "@/components/oggi-fest/ice-cream-line-card";
import { useFestCatalog } from "@/lib/oggi-fest/use-fest-catalog";
import type { IceCreamLine } from "@/lib/oggi-fest/types";

type Props = {
  className?: string;
};

const TYPE_LABELS: Record<string, string> = {
  palitos: "Palitos (90g)",
  minicups: "MiniCups",
  cups: "Cups",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  palitos: "Nossos picolés premium em palito, perfeitos para qualquer ocasião",
  minicups: "Porções pequenas em copinho para quem quer provar vários sabores",
  cups: "Porções maiores em copo para os apaixonados por sorvete",
};

export function FestCatalogByType({ className }: Props) {
  const { lines } = useFestCatalog();

  // Agrupar por tipo
  const linesByType = lines.reduce(
    (acc, line) => {
      const type = line.type as "palitos" | "minicups" | "cups";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(line);
      return acc;
    },
    {} as Record<"palitos" | "minicups" | "cups", IceCreamLine[]>
  );

  // Ordem fixa
  const types: ("palitos" | "minicups" | "cups")[] = ["palitos", "minicups", "cups"];

  return (
    <div className={className}>
      {types.map((type) => {
        const typeLines = linesByType[type] ?? [];
        if (typeLines.length === 0) return null;

        return (
          <section key={type} className="mb-12">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary mb-2">
                {TYPE_LABELS[type]}
              </h2>
              <p className="text-sm text-muted-foreground">{TYPE_DESCRIPTIONS[type]}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {typeLines.length} {typeLines.length === 1 ? "sabor" : "sabores"} disponíveis
              </p>
            </div>
            <ul className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {typeLines.map((line) => (
                <li key={line.id}>
                  <IceCreamLineCard line={line} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
