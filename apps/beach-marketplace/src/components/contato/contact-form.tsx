"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { trackGenerateLead } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          ...(subject.trim() ? { subject: subject.trim() } : {}),
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar.");
        return;
      }
      trackGenerateLead({ method: "contact_form" });
      setSuccess(true);
      setMessage("");
      setSubject("");
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg border-border/80">
      <CardHeader>
        <CardTitle className="font-serif text-2xl tracking-tight">Envie sua mensagem</CardTitle>
        <CardDescription>
          Respondemos por e-mail. Campos marcados com * são obrigatórios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ct-name">Nome *</Label>
            <Input
              id="ct-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-email">E-mail *</Label>
            <Input
              id="ct-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-subject">Assunto (opcional)</Label>
            <Input
              id="ct-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-msg">Mensagem *</Label>
            <textarea
              id="ct-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              placeholder="Conte como podemos ajudar…"
              className={cn(
                "min-h-[9rem] w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-[1.0625rem] leading-normal text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
              )}
            />
            <p className="text-xs text-muted-foreground">Mínimo 10 caracteres.</p>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-muted-foreground">
              Mensagem enviada. Em breve entraremos em contacto no e-mail que indicou.
            </p>
          ) : null}
          <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
            {loading ? (
              <>
                <LottieLoading height={28} />
                Enviando…
              </>
            ) : (
              "Enviar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
