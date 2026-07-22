"use client";

import Image from "next/image";
import { useFestCatalog } from "@/lib/oggi-fest/use-fest-catalog";

export function FestCatalogTemplatePills() {
  const { templates } = useFestCatalog();

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <li
          key={t.id}
          className="overflow-hidden rounded-2xl border-2 border-primary/15 bg-card shadow-sm transition hover:border-primary/35 hover:shadow-md"
        >
          <div className="relative aspect-[16/10] bg-muted">
            <Image
              src={t.imageUrl}
              alt={t.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, 320px"
            />
          </div>
          <p className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-primary">
            {t.name}
          </p>
        </li>
      ))}
    </ul>
  );
}
