"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { liberarOfertaVitrineAction } from "@/app/(painel)/painel/executor/executor-producao-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DemoProductionAssignment } from "@/lib/demo-seed";
import { executorAssignmentStatusLabel } from "@/lib/executor-assignment-labels";

type Props = {
  assignmentId: string;
  status: DemoProductionAssignment["status"];
  initialUnitsProduced: number;
};

export function ExecutorLiberarVitrine({ assignmentId, status, initialUnitsProduced }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(String(Math.max(1, initialUnitsProduced || 1)));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (status === "PUBLISHED") {
    return (
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-sm text-foreground">
        <p className="font-medium text-emerald-900 dark:text-emerald-100">
          {executorAssignmentStatusLabel("PUBLISHED")}
        </p>
        <p className="mt-1 text-muted-foreground">
          Clientes já podem ver e comprar enquanto houver estoque e o modelo estiver ativo na loja.
        </p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const n = Number.parseInt(qty.replace(/\D/g, ""), 10);
    if (!Number.isFinite(n) || n < 1) {
      setError("Use um número inteiro maior ou igual a 1.");
      return;
    }
    setPending(true);
    try {
      await liberarOfertaVitrineAction(assignmentId, n);
      setOk("Oferta liberada na vitrine pública.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível publicar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 border-t border-border pt-4">
      <div>
        <p className="text-sm font-medium text-foreground">{executorAssignmentStatusLabel(status)}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Ao liberar, você define quantas unidades entram no estoque vendável na loja. A peça só
          aparece na vitrine se o modelo estiver ativo e visível para o público.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`pub-qty-${assignmentId}`}>Quantidade à venda (unidades)</Label>
        <Input
          id={`pub-qty-${assignmentId}`}
          inputMode="numeric"
          className="max-w-[8rem]"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          disabled={pending}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
          {ok}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Publicando…" : "Liberar na vitrine pública"}
      </Button>
    </form>
  );
}
