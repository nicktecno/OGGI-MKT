"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { Button } from "@/components/ui/button";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { trackLogin } from "@/lib/analytics";
import { MOCK_ADMIN_EMAIL, MOCK_ADMIN_PASSWORD } from "@/lib/mock-users";
import { SITE_NAME } from "@/lib/site";

type LoginFormProps = {
  /** Após login bem-sucedido (caminho interno, ex.: `/checkout`). */
  redirectTo?: string;
  initialEmail?: string;
  initialPassword?: string;
};

const INPUT_CLASS =
  "border-2 border-primary/15 bg-white focus-visible:border-primary focus-visible:ring-primary/25";

export function LoginForm({
  redirectTo,
  initialEmail = MOCK_ADMIN_EMAIL,
  initialPassword = MOCK_ADMIN_PASSWORD,
}: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
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
      trackLogin({ method: "email" });
      window.location.assign(data.redirect ?? "/");
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Entrar"
      description={`${SITE_NAME} — acompanhe pedidos e continue montando seu carrinho de sorvete.`}
    >
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
            placeholder="seuemail@exemplo.com.br"
            required
            className={INPUT_CLASS}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className="font-semibold text-foreground">
              Senha
            </Label>
            <Link
              href="/esqueci-senha"
              className="text-xs font-bold uppercase tracking-wide text-primary underline-offset-4 hover:underline"
            >
              Esqueci a senha
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
              <span>Entrando…</span>
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/registrar"
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link href="/fest" className="font-medium text-muted-foreground underline-offset-4 hover:text-primary">
          Voltar para montar pedido Oggi Fest
        </Link>
      </p>
    </AuthFormShell>
  );
}
