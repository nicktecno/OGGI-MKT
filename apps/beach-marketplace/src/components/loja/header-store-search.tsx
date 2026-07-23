"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { StoreSearch } from "@/components/loja/store-search";

/** Lê `?q=` da URL (client) para manter o campo alinhado à página da loja. */
export function HeaderStoreSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q =
    pathname === "/loja" || pathname.startsWith("/loja/")
      ? (searchParams.get("q") ?? "").trim()
      : "";

  return <StoreSearch defaultQuery={q} variant="header" key={`${pathname}?q=${q}`} className="w-full" />;
}
