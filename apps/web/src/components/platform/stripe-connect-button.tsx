"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startStripeConnectAction } from "@/app/(painel)/painel/_actions/platform-me-actions";

type Props = {
  /** Já concluiu onboarding no Stripe (API). */
  onboardingComplete: boolean;
  hasStripeAccount: boolean;
};

export function StripeConnectButton({ onboardingComplete, hasStripeAccount }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setMessage(null);
    setLoading(true);
    try {
      const r = await startStripeConnectAction();
      if (r.url) {
        window.location.href = r.url;
        return;
      }
      setMessage(r.message ?? "Não foi possível abrir o Stripe.");
    } catch {
      setMessage("Erro ao conectar. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (onboardingComplete) {
    return (
      <p className="text-sm text-muted-foreground">
        Pagamentos: conta Stripe conectada e onboarding concluído.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" disabled={loading} onClick={() => void onClick()}>
        {loading ? "Abrindo…" : hasStripeAccount ? "Continuar cadastro Stripe" : "Conectar conta Stripe"}
      </Button>
      {message ? (
        <p className="max-w-xl text-sm leading-relaxed text-foreground/90" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
