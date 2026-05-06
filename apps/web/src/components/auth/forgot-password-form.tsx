"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { SITE_NAME } from "@/lib/site";

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
    <Card className="border-border/80 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="font-serif text-2xl tracking-tight">Esqueci a senha</CardTitle>
        <CardDescription>
          {SITE_NAME} — enviaremos um link seguro se o e-mail estiver cadastrado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Se existir uma conta para <span className="font-medium text-foreground">{email}</span>,
              você receberá um e-mail com instruções para redefinir a senha.
            </p>
            <p>Confira também a pasta de spam.</p>
            <Link
              href="/entrar"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "inline-flex w-full justify-center")}
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
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
        )}
        {!sent ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">
              Voltar ao login
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
