"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackSearch } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type StoreSearchProps = {
  /** Valor inicial (ex.: vindo de `searchParams` no servidor) */
  defaultQuery?: string;
  className?: string;
  /** Barra compacta para o header */
  variant?: "default" | "header";
};

export function StoreSearch({
  defaultQuery = "",
  className,
  variant = "default",
}: StoreSearchProps) {
  const router = useRouter();
  const isHeader = variant === "header";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    if (q) trackSearch(q);
    const url = q ? `/loja?q=${encodeURIComponent(q)}` : "/loja";
    router.push(url);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full items-center",
        isHeader ? "gap-2" : "flex-col gap-3 sm:flex-row",
        className,
      )}
    >
      <label className="sr-only" htmlFor={isHeader ? "header-loja-busca" : "loja-busca"}>
        Buscar na loja
      </label>
      <Input
        id={isHeader ? "header-loja-busca" : "loja-busca"}
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={isHeader ? "Peça, SKU, costureira…" : "Buscar por peça, SKU ou costureira…"}
        defaultValue={defaultQuery}
        className={cn(
          "min-w-0 flex-1 bg-background",
          isHeader ? "h-9 text-sm" : "h-12",
        )}
      />
      <Button type="submit" size={isHeader ? "sm" : "default"} className="shrink-0">
        Buscar
      </Button>
    </form>
  );
}
