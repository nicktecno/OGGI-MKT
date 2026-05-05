import type { Metadata } from "next";
import { commerceUsesDatabase } from "@/lib/demo-runtime";
import { fetchStripeAdminSummary } from "@/lib/platform-internal";
import { formatBrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Financeiro (Stripe)",
};

function centsToBrl(value: number): string {
  return formatBrl((value || 0) / 100);
}

function boolLabel(v: boolean): string {
  return v ? "Sim" : "Não";
}

export default async function AdminFinanceiroPage() {
  const apiOn = commerceUsesDatabase();
  const summary = apiOn ? await fetchStripeAdminSummary() : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro (Stripe)</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Resumo de vendas e repasses a partir da conta Stripe da plataforma, incluindo totais de
          comissão da plataforma, executores e fornecedores.
        </p>
      </div>

      {!apiOn ? (
        <p className="text-sm text-muted-foreground">
          Esta aba depende da API com banco de dados e integração interna ativas.
        </p>
      ) : !summary ? (
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os dados agora. Verifique se a API está online.
        </p>
      ) : !summary.configured ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          {summary.message ?? "Stripe não está configurado na API."}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-medium text-foreground">Conta da plataforma</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Account ID</dt>
                <dd className="font-mono text-foreground">{summary.account?.id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="text-foreground">{summary.account?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">País / moeda</dt>
                <dd className="text-foreground">
                  {summary.account?.country ?? "—"} /{" "}
                  {(summary.account?.default_currency ?? "—").toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cobranças / saques habilitados</dt>
                <dd className="text-foreground">
                  {boolLabel(Boolean(summary.account?.charges_enabled))} /{" "}
                  {boolLabel(Boolean(summary.account?.payouts_enabled))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-medium text-foreground">Resumo comercial</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Número de vendas</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {summary.metrics?.vendas_count ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendas totais</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {centsToBrl(summary.metrics?.total_vendas_centavos ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Comissão da plataforma
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {centsToBrl(summary.metrics?.plataforma_comissao_centavos ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fonte da comissão</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summary.notes?.comissao_source ?? "—"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-medium text-foreground">Repasses recebidos</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Executores</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {centsToBrl(summary.metrics?.executores_receberam_centavos ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fornecedores</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {centsToBrl(summary.metrics?.fornecedores_receberam_centavos ?? 0)}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
