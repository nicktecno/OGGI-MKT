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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cadastros pendentes</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Fornecedores e costureiras que se registraram e aguardam aprovação para operar na loja.
        </p>
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
