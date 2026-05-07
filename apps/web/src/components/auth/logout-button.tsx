"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
};

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
        "max-[999px]:h-9 max-[999px]:w-9 max-[999px]:shrink-0 max-[999px]:rounded-full max-[999px]:p-0",
        className,
      )}
      onClick={logout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin min-[1000px]:hidden" aria-hidden />
          <span className="hidden min-[1000px]:inline">Saindo…</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 min-[1000px]:hidden" aria-hidden />
          <span className="max-[999px]:sr-only">Sair</span>
        </>
      )}
    </Button>
  );
}
