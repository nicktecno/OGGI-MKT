"use client";

import { IceCreamLineCard } from "@/components/loslos-fest/ice-cream-line-card";
import { useFestCatalog } from "@/lib/loslos-fest/use-fest-catalog";

type Props = {
  className?: string;
};

export function FestCatalogLinesGrid({ className }: Props) {
  const { lines } = useFestCatalog();

  return (
    <ul className={className ?? "mt-10 grid gap-5 grid-cols-2 md:grid-cols-4"}>
      {lines.map((line) => (
        <li key={line.id}>
          <IceCreamLineCard line={line} />
        </li>
      ))}
    </ul>
  );
}
