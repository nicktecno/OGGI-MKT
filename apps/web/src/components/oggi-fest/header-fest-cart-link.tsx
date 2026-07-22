"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import {
  FEST_CART_CHANGED_EVENT,
  festOrderUnitCount,
  readFestOrder,
} from "@/lib/oggi-fest/cart-storage";
import { cn } from "@/lib/utils";

export function HeaderFestCartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      const order = readFestOrder();
      setCount(order ? festOrderUnitCount(order) : 0);
    }
    sync();
    window.addEventListener(FEST_CART_CHANGED_EVENT, sync);
    return () => window.removeEventListener(FEST_CART_CHANGED_EVENT, sync);
  }, []);

  return (
    <Link
      href="/carrinho"
      title="Meu pedido Los Los Fest"
      aria-label={`Meu pedido Los Los Fest${count > 0 ? `, ${count} unidades` : ""}`}
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-accent"
    >
      <ShoppingCart className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      {count > 0 ? (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ffc72c] px-1 text-[0.625rem] font-extrabold text-[#2d2d2d]",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
