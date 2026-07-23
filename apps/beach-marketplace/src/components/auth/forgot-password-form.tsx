"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { SITE_NAME } from "@/lib/site";

const INPUT_CLASS =
  "border-2 border-primary/15 bg-card focus-visible:border-primary focus-visible:ring-primary/25";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o e-mail.");
        return;
      }
      setSent(true);
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Esqueci a senha"
      description={`${SITE_NAME} — enviaremos um link seguro se o e-mail estiver cadastrado.`}
    >
      {sent ? (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Se existir uma conta para <span className="font-semibold text-primary">{email}</span>,
            você receberá um e-mail com instruções para redefinir a senha.
          </p>
          <p>Confira também a pasta de spam.</p>
          <Link
            href="/entrar"
            className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center")}
          >
            Voltar ao login
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <LottieLoading height={28} />
                  <span>Enviando…</span>
                </>
              ) : (
                "Enviar link"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link
              href="/entrar"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              Voltar ao login
            </Link>
          </p>
        </>
      )}
    </AuthFormShell>
  );
}
