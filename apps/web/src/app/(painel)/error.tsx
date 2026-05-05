"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function PainelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[painel]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center shadow-sm">
      <h2 className="font-serif text-xl font-medium text-foreground">Não foi possível carregar esta página</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        O servidor não conseguiu obter os dados (por exemplo ligação à API interna ou variáveis de ambiente em
        produção). Confirme que a API Nest está acessível a partir do host do Next e que{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">COMMERCE_API_URL</code> /{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">SERVER_API_URL</code> e{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">INTERNAL_API_SECRET</code> estão
        corretos.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground">Referência: {error.digest}</p>
      ) : null}
      <Button type="button" className="mt-6" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
