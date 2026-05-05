"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { cn } from "@/lib/utils";

export function useAdminMutations() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<void>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await fn();
        setMessage("Tudo certo, alterações guardadas.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível guardar.");
      }
    });
  }

  return { pending, message, error, run };
}

export function AdminFlash({
  message,
  error,
  pending,
}: {
  message: string | null;
  error: string | null;
  pending?: boolean;
}) {
  if (pending) {
    return (
      <div
        className="flex items-center gap-4 rounded-2xl border border-border/50 bg-gradient-to-r from-card/90 to-muted/30 px-5 py-3.5 shadow-sm ring-1 ring-foreground/[0.04]"
        role="status"
        aria-live="polite"
      >
        <LottieLoading className="shrink-0" height={44} />
        <span className="text-sm font-medium text-muted-foreground">A guardar alterações…</span>
      </div>
    );
  }
  if (!message && !error) return null;
  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-3.5 text-base leading-relaxed shadow-sm ring-1 ring-foreground/[0.03]",
        error
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border/60 bg-gradient-to-r from-muted/40 to-muted/20 text-foreground",
      )}
      role="status"
    >
      {error ?? message}
    </div>
  );
}
