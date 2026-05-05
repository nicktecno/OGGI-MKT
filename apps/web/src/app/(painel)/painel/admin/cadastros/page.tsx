import type { Metadata } from "next";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { serverApiUrl } from "@/lib/server-api-url";
import type { PendingPlatformAccount } from "./cadastros-client";
import { CadastrosModeracaoClient } from "./cadastros-client";

export const metadata: Metadata = {
  title: "Cadastros pendentes",
};

async function loadPending(): Promise<PendingPlatformAccount[]> {
  if (!commerceUsesDatabase()) return [];
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  const res = await fetch(`${serverApiUrl()}/internal/platform/accounts/pending`, {
    headers: { "x-internal-secret": secret },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as PendingPlatformAccount[];
}

export default async function AdminCadastrosPage() {
  const pending = await loadPending();
  const apiOn = commerceUsesDatabase();

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 via-card/50 to-muted/25 p-6 shadow-sm ring-1 ring-foreground/[0.04] sm:p-8">
        <div className="pointer-events-none absolute -right-8 top-0 h-32 w-40 rounded-full bg-accent/[0.09] blur-3xl" />
        <div className="relative">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-accent">Moderação</p>
          <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Cadastros pendentes
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Fornecedores e costureiras que se registraram e aguardam aprovação para operar na loja.
          </p>
        </div>
      </div>

      {!apiOn ? (
        <p className="text-sm text-muted-foreground">
          Esta lista depende da API com banco de dados e da integração interna ativadas na
          configuração do app web.
        </p>
      ) : (
        <CadastrosModeracaoClient initial={pending} />
      )}
    </div>
  );
}
