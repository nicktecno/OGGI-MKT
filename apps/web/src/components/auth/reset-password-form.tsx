"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LottieLoading } from "@/components/ui/lottie-loading";
import { SITE_NAME } from "@/lib/site";

const INPUT_CLASS =
  "border-2 border-primary/15 bg-white focus-visible:border-primary focus-visible:ring-primary/25";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (!token) {
      setError("Link inválido. Solicite um novo e-mail em “Esqueci a senha”.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }
      router.replace("/entrar?senha=redefinida");
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthFormShell
        title="Link inválido"
        description={`Abra o link enviado por e-mail ou solicite um novo em ${SITE_NAME}.`}
      >
        <Link
          href="/esqueci-senha"
          className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center")}
        >
          Esqueci a senha
        </Link>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell title="Nova senha" description="Escolha uma senha forte para a sua conta.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="font-semibold text-foreground">
            Nova senha
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className={INPUT_CLASS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="font-semibold text-foreground">
            Confirmar senha
          </Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
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
              <span>Salvando…</span>
            </>
          ) : (
            "Redefinir senha"
          )}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/entrar" className="font-bold text-primary underline-offset-4 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </AuthFormShell>
  );
}
