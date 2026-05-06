"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
      <Card className="border-border/80 bg-card/95 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl tracking-tight">Link inválido</CardTitle>
          <CardDescription>
            Abra o link enviado por e-mail ou solicite um novo em {SITE_NAME}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/esqueci-senha"
            className={cn(buttonVariants({ variant: "default", size: "lg" }), "inline-flex w-full justify-center")}
          >
            Esqueci a senha
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="font-serif text-2xl tracking-tight">Nova senha</CardTitle>
        <CardDescription>Escolha uma senha forte para a sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
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
                <span>Salvando…</span>
              </>
            ) : (
              "Redefinir senha"
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
