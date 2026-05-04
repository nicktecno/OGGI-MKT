"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT, cartLineCount, readCart } from "@/lib/cart-storage";
import { cn } from "@/lib/utils";

export function HeaderCartLink({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      setCount(cartLineCount(readCart()));
    }
    sync();
    window.addEventListener(CART_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link
      href="/carrinho"
      className={cn(
        "relative shrink-0 text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      Carrinho
      {count > 0 ? (
        <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold leading-none text-accent-foreground">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
