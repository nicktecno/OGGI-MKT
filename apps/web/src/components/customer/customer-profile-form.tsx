"use client";

import { useState } from "react";
import { patchCustomerProfileAction } from "@/app/(painel)/painel/_actions/platform-me-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LottieLoading } from "@/components/ui/lottie-loading";

type Props = {
  initialName: string;
  email: string;
};

export function CustomerProfileForm({ initialName, email }: Props) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setLoading(true);
    try {
      await patchCustomerProfileAction({ name });
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" value={email} disabled className="bg-muted/40" readOnly />
        <p className="text-xs text-muted-foreground">O e-mail de login não pode ser alterado aqui.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={120}
          required
          className="bg-background"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-muted-foreground">
          Nome atualizado. Se o menu ainda mostrar o nome antigo, saia e entre de novo para renovar a
          sessão.
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="gap-2">
        {loading ? (
          <>
            <LottieLoading height={24} />
            Salvando…
          </>
        ) : (
          "Salvar"
        )}
      </Button>
    </form>
  );
}
