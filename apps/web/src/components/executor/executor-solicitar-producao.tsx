"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { solicitarProducaoAction } from "@/app/(painel)/painel/executor/executor-producao-actions";

type Option = { id: string; nome: string };

export function ExecutorSolicitarProducao({ options }: { options: Option[] }) {
  const [productId, setProductId] = useState<string>(options[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Não há peças disponíveis para novo pedido (todas já têm atribuição ativa ou pedido pendente).
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (!productId) return;
    setPending(true);
    try {
      await solicitarProducaoAction(productId);
      setOk(
        "Pedido enviado. Os administradores recebem um e-mail quando o servidor de e-mail estiver configurado.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o pedido.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pedido-peca">Peça</Label>
        <select
          id="pedido-peca"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-muted-foreground" role="status">
          {ok}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || !productId}>
        {pending ? "Enviando…" : "Pedir para executar esta peça"}
      </Button>
    </form>
  );
}
