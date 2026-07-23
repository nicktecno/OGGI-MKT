"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearCart } from "@/lib/cart-storage";
import { clearCheckoutDelivery } from "@/lib/checkout-delivery-storage";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  /** `panel`: largura total na barra lateral do painel; `header`: comportamento responsivo do site. */
  variant?: "header" | "panel";
};

/** Texto em &lt;sm e ≥1000px; ícone entre sm e 999px (variante header). */
export function LogoutButton({ className, variant = "header" }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      clearCart();
      clearCheckoutDelivery();
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const isPanel = variant === "panel";

  return (
    <Button
      type="button"
      variant={isPanel ? "ghost" : "outline"}
      size="default"
      title="Sair"
      aria-label={loading ? "A sair…" : "Sair"}
      className={cn(
        isPanel
          ? "h-auto w-full justify-start gap-2 rounded-md border border-border/50 bg-muted/35 py-2.5 pl-2.5 pr-3 text-sm font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-background hover:text-foreground dark:bg-muted/25"
          : "shrink-0 sm:h-9 sm:w-9 sm:rounded-full sm:p-0 min-[1000px]:h-auto min-[1000px]:w-auto min-[1000px]:px-5 min-[1000px]:py-2",
        className,
      )}
      onClick={logout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2
            className={cn("h-4 w-4 animate-spin", !isPanel && "hidden sm:inline min-[1000px]:hidden")}
            aria-hidden
          />
          <span className={cn(!isPanel && "inline sm:hidden min-[1000px]:inline")}>Saindo…</span>
        </>
      ) : (
        <>
          <LogOut
            className={cn("h-4 w-4 shrink-0", !isPanel && "hidden sm:inline min-[1000px]:hidden")}
            aria-hidden
          />
          <span className={cn(!isPanel && "inline sm:hidden min-[1000px]:inline")}>Sair</span>
        </>
      )}
    </Button>
  );
}
