"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
};

/** Texto em &lt;sm e ≥1000px; ícone entre sm e 999px. */
export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      title="Sair"
      aria-label={loading ? "A sair…" : "Sair"}
      className={cn(
        "shrink-0 sm:h-9 sm:w-9 sm:rounded-full sm:p-0 min-[1000px]:h-auto min-[1000px]:w-auto min-[1000px]:px-5 min-[1000px]:py-2",
        className,
      )}
      onClick={logout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="hidden h-4 w-4 animate-spin sm:inline min-[1000px]:hidden" aria-hidden />
          <span className="inline sm:hidden min-[1000px]:inline">Saindo…</span>
        </>
      ) : (
        <>
          <LogOut className="hidden h-4 w-4 sm:inline min-[1000px]:hidden" aria-hidden />
          <span className="inline sm:hidden min-[1000px]:inline">Sair</span>
        </>
      )}
    </Button>
  );
}
