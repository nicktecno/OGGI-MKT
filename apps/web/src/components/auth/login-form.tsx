"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LottieLoading } from "@/components/ui/lottie-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_NAME } from "@/lib/site";

type LoginFormProps = {
  /** Após login bem-sucedido (caminho interno, ex.: `/checkout`). */
  redirectTo?: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...(redirectTo ? { next: redirectTo } : {}) }),
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; redirect?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar");
        return;
      }
      window.location.assign(data.redirect ?? "/");
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/80 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="font-serif text-2xl tracking-tight">Entrar</CardTitle>
        <CardDescription>
          {SITE_NAME} — sessão segura. O carrinho permanece neste navegador até você concluir a compra.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              placeholder="admin@demo.local"
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/esqueci-senha"
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
                <span>Entrando…</span>
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem cadastro (cliente ou parceiro)?{" "}
          <Link href="/registrar" className="font-medium text-foreground underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Ambiente de exemplo:</span> várias contas de
          teste usam a senha <code className="rounded bg-muted px-1">Demo#2026</code> — Admin{" "}
          <code className="rounded bg-muted px-1">admin@demo.local</code>, fornecedores{" "}
          <code className="rounded bg-muted px-1">fornecedor@demo.local</code> e{" "}
          <code className="rounded bg-muted px-1">aviamentos@demo.local</code>, executor{" "}
          <code className="rounded bg-muted px-1">executor@demo.local</code>, cliente loja{" "}
          <code className="rounded bg-muted px-1">cliente@demo.local</code>.
        </p>
      </CardContent>
    </Card>
  );
}
