"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
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
      title="Carrinho"
      aria-label="Carrinho"
      className={cn(
        "relative inline-flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground",
        "max-[999px]:h-9 max-[999px]:w-9 max-[999px]:justify-center",
        className,
      )}
    >
      <ShoppingBag className="h-[1.125rem] w-[1.125rem] min-[1000px]:hidden" aria-hidden />
      <span className="hidden text-[0.8125rem] font-medium uppercase tracking-[0.16em] min-[1000px]:inline">
        Carrinho
      </span>
      {count > 0 ? (
        <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold leading-none text-accent-foreground min-[1000px]:-right-2 min-[1000px]:-top-1.5">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
