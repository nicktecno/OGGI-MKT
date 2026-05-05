"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export type AdminMutationRun = (fn: () => void | Promise<void>, scope?: string) => void;

export function adminActionLoading(
  pending: boolean,
  pendingScope: string | null,
  scope: string,
): boolean {
  return pending && pendingScope === scope;
}

export function useAdminMutations() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [pendingScope, setPendingScope] = useState<string | null>(null);

  const run = useCallback<AdminMutationRun>((fn, scope = "__global__") => {
    void (async () => {
      setPending(true);
      setPendingScope(scope);
      try {
        await fn();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível guardar.");
      } finally {
        setPending(false);
        setPendingScope(null);
      }
    })();
  }, [router]);

  return { pending, pendingScope, run };
}
