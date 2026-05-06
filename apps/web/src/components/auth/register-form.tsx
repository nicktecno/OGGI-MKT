"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import {
  getAccountTerms,
  resolveRegisterTermsRole,
  type AccountTermsRole,
} from "@/lib/account-terms";
import { SITE_NAME } from "@/lib/site";
import { applyViaCepOnBlur, onlyCepDigits } from "@/lib/viacep";
import { cn } from "@/lib/utils";

type RoleChoice = "SUPPLIER" | "EXECUTOR";
type AccountPath = "CUSTOMER" | "PROFESSIONAL";

export function RegisterForm({ apiEnabled }: { apiEnabled: boolean }) {
  const router = useRouter();
  const [accountPath, setAccountPath] = useState<AccountPath>("CUSTOMER");
  const [role, setRole] = useState<RoleChoice>("EXECUTOR");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [cep, setCep] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [executorCep, setExecutorCep] = useState("");
  const [executorPhone, setExecutorPhone] = useState("");
  const [executorAddressLine1, setExecutorAddressLine1] = useState("");
  const [executorAddressComplement, setExecutorAddressComplement] = useState("");
  const [executorCity, setExecutorCity] = useState("");
  const [executorStateUf, setExecutorStateUf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const termsRole: AccountTermsRole = useMemo(
    () => resolveRegisterTermsRole(accountPath, role),
    [accountPath, role],
  );
  const termsBlock = useMemo(() => getAccountTerms(termsRole), [termsRole]);

  useEffect(() => {
    setAcceptTerms(false);
  }, [termsRole]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptTerms) {
      setError("Marque a caixa para aceitar os termos de uso do seu tipo de conta.");
      return;
    }
    if (!apiEnabled) {
      setError("Cadastro público não está disponível (API não configurada).");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        acceptTerms: true,
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      };
      if (accountPath === "CUSTOMER") {
        body.role = "CUSTOMER";
      } else {
        body.role = role;
        if (role === "SUPPLIER") {
          body.businessName = businessName.trim();
          body.cep = cep.trim();
          body.phone = phone.trim();
          body.addressLine1 = addressLine1.trim();
          if (addressComplement.trim()) body.addressComplement = addressComplement.trim();
          body.city = city.trim();
          body.stateUf = stateUf.trim().toUpperCase();
        } else {
          body.displayName = displayName.trim();
          body.executorCep = executorCep.trim();
          body.executorPhone = executorPhone.trim();
          body.executorAddressLine1 = executorAddressLine1.trim();
          if (executorAddressComplement.trim()) {
            body.executorAddressComplement = executorAddressComplement.trim();
          }
          body.executorCity = executorCity.trim();
          body.executorStateUf = executorStateUf.trim().toUpperCase();
        }
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível cadastrar");
        return;
      }
      router.push(
        accountPath === "CUSTOMER" ? "/entrar?cadastro=cliente" : "/entrar?cadastro=pendente",
      );
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/80 bg-card/95 shadow-xl backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="font-serif text-2xl tracking-tight">Criar conta</CardTitle>
        <CardDescription>
          {SITE_NAME} — cliente da loja ou parceiro (fornecedor / costureira). Parceiros passam por
          aprovação da equipe antes do painel completo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAccountPath("CUSTOMER")}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all sm:min-h-[5.75rem]",
                accountPath === "CUSTOMER"
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-muted/20 hover:border-muted-foreground/25",
              )}
            >
              <span className="block text-sm font-semibold tracking-tight">Cliente</span>
              <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                Comprar na loja. Após cadastrar, você já pode entrar — sem etapa de aprovação de
                parceiro.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAccountPath("PROFESSIONAL")}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all sm:min-h-[5.75rem]",
                accountPath === "PROFESSIONAL"
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-muted/20 hover:border-muted-foreground/25",
              )}
            >
              <span className="block text-sm font-semibold tracking-tight">Parceiro</span>
              <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                Fornecedor de insumos ou costureira. O cadastro passa pela equipe antes do painel.
              </span>
            </button>
          </div>

          {accountPath === "PROFESSIONAL" ? (
          <div className="rounded-xl border-2 border-border bg-muted/30 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 sm:gap-5">
              <button
                type="button"
                onClick={() => setRole("EXECUTOR")}
                className={cn(
                  "min-w-0 flex-1 rounded-lg px-2 py-2 text-left transition-colors sm:px-3",
                  role === "EXECUTOR"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="block text-sm font-semibold tracking-tight">Costureira</span>
                <span className="mt-0.5 block text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Executor
                </span>
              </button>

              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <span
                  id="reg-role-label"
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                >
                  Tipo
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={role === "SUPPLIER"}
                  aria-labelledby="reg-role-label"
                  aria-label={
                    role === "SUPPLIER"
                      ? "Cadastro como fornecedor. Clique para costureira."
                      : "Cadastro como costureira. Clique para fornecedor."
                  }
                  onClick={() => setRole((r) => (r === "EXECUTOR" ? "SUPPLIER" : "EXECUTOR"))}
                  className={cn(
                    "relative flex h-12 w-[5.25rem] shrink-0 cursor-pointer items-center rounded-full border-2 p-1.5 shadow-inner transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    role === "SUPPLIER"
                      ? "border-primary/50 bg-primary/20"
                      : "border-border bg-muted/90",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none h-9 w-9 rounded-full bg-background shadow-md ring-2 ring-primary/25 transition-[margin,transform] duration-200 ease-out",
                      role === "SUPPLIER" ? "ml-auto" : "mr-auto",
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "whitespace-nowrap text-center text-[0.7rem] font-semibold uppercase tracking-wide",
                    role === "SUPPLIER" ? "text-primary" : "text-foreground",
                  )}
                >
                  {role === "SUPPLIER" ? "Fornecedor ativo" : "Costureira ativa"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setRole("SUPPLIER")}
                className={cn(
                  "min-w-0 flex-1 rounded-lg px-2 py-2 text-right transition-colors sm:px-3",
                  role === "SUPPLIER"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="block text-sm font-semibold tracking-tight">Fornecedor</span>
                <span className="mt-0.5 block text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Insumos
                </span>
              </button>
            </div>
            <p className="mt-3 border-t border-border/60 pt-3 text-center text-sm text-muted-foreground">
              Você está se cadastrando como{" "}
              <strong className="font-semibold text-foreground">
                {role === "SUPPLIER" ? "fornecedor de insumos" : "costureira (executor)"}
              </strong>
              . Deslize o interruptor ou toque nos nomes para alternar.
            </p>
          </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Use nome, e-mail e senha abaixo para criar sua conta de cliente.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reg-name">Nome completo</Label>
              <Input
                id="reg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reg-email">E-mail</Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reg-pass">Senha (mín. 8 caracteres)</Label>
              <Input
                id="reg-pass"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-background"
              />
            </div>
          </div>

          {accountPath === "PROFESSIONAL" && role === "SUPPLIER" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Razão social</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>CEP</Label>
                <Input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={(e) =>
                    void applyViaCepOnBlur(e.currentTarget.value, (v) => {
                      setCep(onlyCepDigits(v.cep));
                      if (v.logradouro) setAddressLine1(v.logradouro);
                      if (v.localidade) setCity(v.localidade);
                      if (v.uf) setStateUf(v.uf.slice(0, 2).toUpperCase());
                      const extra = [v.complemento, v.bairro ? `Bairro: ${v.bairro}` : ""].filter(Boolean).join(" · ");
                      if (extra) setAddressComplement((c) => (c?.trim() ? `${c.trim()} · ${extra}` : extra));
                    })
                  }
                  required
                  disabled={loading}
                  className="max-w-[14rem] bg-background"
                />
                <p className="text-xs text-muted-foreground">Com 8 dígitos, ViaCEP ao sair do campo.</p>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required className="bg-background" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Complemento</Label>
                <Input
                  value={addressComplement}
                  onChange={(e) => setAddressComplement(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value)}
                  required
                  maxLength={2}
                  className="bg-background"
                />
              </div>
            </div>
          ) : accountPath === "PROFESSIONAL" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome público (como aparece para a loja)</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>CEP</Label>
                <Input
                  value={executorCep}
                  onChange={(e) => setExecutorCep(e.target.value)}
                  onBlur={(e) =>
                    void applyViaCepOnBlur(e.currentTarget.value, (v) => {
                      setExecutorCep(onlyCepDigits(v.cep));
                      if (v.logradouro) setExecutorAddressLine1(v.logradouro);
                      if (v.localidade) setExecutorCity(v.localidade);
                      if (v.uf) setExecutorStateUf(v.uf.slice(0, 2).toUpperCase());
                      const extra = [v.complemento, v.bairro ? `Bairro: ${v.bairro}` : ""].filter(Boolean).join(" · ");
                      if (extra) {
                        setExecutorAddressComplement((c) => (c?.trim() ? `${c.trim()} · ${extra}` : extra));
                      }
                    })
                  }
                  required
                  disabled={loading}
                  className="max-w-[14rem] bg-background"
                />
                <p className="text-xs text-muted-foreground">Com 8 dígitos, ViaCEP ao sair do campo.</p>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={executorPhone}
                  onChange={(e) => setExecutorPhone(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={executorAddressLine1}
                  onChange={(e) => setExecutorAddressLine1(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Complemento</Label>
                <Input
                  value={executorAddressComplement}
                  onChange={(e) => setExecutorAddressComplement(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={executorCity}
                  onChange={(e) => setExecutorCity(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  value={executorStateUf}
                  onChange={(e) => setExecutorStateUf(e.target.value)}
                  required
                  maxLength={2}
                  className="bg-background"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <details className="group text-sm">
              <summary className="cursor-pointer list-none font-medium text-foreground underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block size-2 rounded-full bg-primary/80 transition-transform group-open:rotate-90"
                  />
                  Ler na íntegra: {termsBlock.title}
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{termsBlock.intro}</p>
              <ul className="mt-3 space-y-3">
                {termsBlock.sections.map((s) => (
                  <li key={s.heading} className="border-t border-border/60 pt-3 first:border-t-0 first:pt-0">
                    <p className="font-medium text-foreground">{s.heading}</p>
                    <p className="mt-1 text-muted-foreground leading-relaxed">{s.body}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Versão registrada: {termsBlock.version}</p>
            </details>

            <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 size-4 shrink-0 rounded border-border accent-primary"
              />
              <span>
                Li e aceito os termos acima ({termsRole === "CUSTOMER" ? "cliente" : termsRole === "SUPPLIER" ? "fornecedor" : "costureira"}). Entendo que a versão{" "}
                <span className="font-mono text-xs">{termsBlock.version}</span> será associada ao meu cadastro.
              </span>
            </label>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={loading || !apiEnabled || !acceptTerms}
          >
            {loading ? (
              <>
                <LottieLoading height={28} />
                <span>Enviando…</span>
              </>
            ) : (
              "Enviar cadastro"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
