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
        className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <LottieLoading className="shrink-0" height={44} />
        <span className="text-sm text-muted-foreground">A guardar alterações…</span>
      </div>
    );
  }
  if (!message && !error) return null;
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-base leading-relaxed",
        error
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-muted/50 text-foreground",
      )}
      role="status"
    >
      {error ?? message}
    </div>
  );
}
