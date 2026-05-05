import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ADMIN_CARD, ADMIN_CARD_HEADER } from "@/components/admin/admin-panel-styles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/45 bg-gradient-to-br from-card to-muted/35 p-4 shadow-sm ring-1 ring-foreground/[0.02]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-2xl font-medium tracking-tight text-foreground">{value}</p>
    </div>
  );
}

export default async function AdminFinanceiroPage() {
  const apiOn = commerceUsesDatabase();
  const summary = apiOn ? await fetchStripeAdminSummary() : null;

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 via-card/50 to-muted/25 p-6 shadow-sm ring-1 ring-foreground/[0.04] sm:p-8">
        <div className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-accent/[0.1] blur-3xl" />
        <div className="relative">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-accent">Integração</p>
          <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Financeiro (Stripe)
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Resumo de vendas e repasses a partir da conta Stripe da plataforma, incluindo totais de comissão da
            plataforma, executores e fornecedores.
          </p>
        </div>
      </div>

      {!apiOn ? (
        <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Esta aba depende da API com banco de dados e integração interna ativas.
        </p>
      ) : !summary ? (
        <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Não foi possível carregar os dados agora. Verifique se a API está online.
        </p>
      ) : !summary.configured ? (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.09] p-5 text-sm text-amber-950 shadow-sm ring-1 ring-amber-500/15 dark:text-amber-50">
          {summary.message ?? "Stripe não está configurado na API."}
        </div>
      ) : (
        <div className="space-y-8">
          <Card className={ADMIN_CARD}>
            <CardHeader className={ADMIN_CARD_HEADER}>
              <CardTitle className="font-serif text-xl">Conta da plataforma</CardTitle>
              <CardDescription>Dados da conta Stripe conectada à plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account ID</dt>
                  <dd className="mt-1 font-mono text-foreground">{summary.account?.id ?? "—"}</dd>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">E-mail</dt>
                  <dd className="mt-1 text-foreground">{summary.account?.email ?? "—"}</dd>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">País / moeda</dt>
                  <dd className="mt-1 text-foreground">
                    {summary.account?.country ?? "—"} / {(summary.account?.default_currency ?? "—").toUpperCase()}
                  </dd>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Cobranças / saques habilitados
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {boolLabel(Boolean(summary.account?.charges_enabled))} /{" "}
                    {boolLabel(Boolean(summary.account?.payouts_enabled))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className={ADMIN_CARD}>
            <CardHeader className={ADMIN_CARD_HEADER}>
              <CardTitle className="font-serif text-xl">Resumo comercial</CardTitle>
              <CardDescription>Totais agregados a partir das cobranças e transferências.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Número de vendas" value={summary.metrics?.vendas_count ?? 0} />
                <StatTile label="Vendas totais" value={centsToBrl(summary.metrics?.total_vendas_centavos ?? 0)} />
                <StatTile
                  label="Comissão da plataforma"
                  value={centsToBrl(summary.metrics?.plataforma_comissao_centavos ?? 0)}
                />
                <div className="rounded-xl border border-border/45 bg-gradient-to-br from-muted/40 to-muted/15 p-4 shadow-sm ring-1 ring-foreground/[0.02]">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Fonte da comissão
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {summary.notes?.comissao_source ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={ADMIN_CARD}>
            <CardHeader className={ADMIN_CARD_HEADER}>
              <CardTitle className="font-serif text-xl">Repasses recebidos</CardTitle>
              <CardDescription>Valores transferidos para parceiros.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatTile
                  label="Executores"
                  value={centsToBrl(summary.metrics?.executores_receberam_centavos ?? 0)}
                />
                <StatTile
                  label="Fornecedores"
                  value={centsToBrl(summary.metrics?.fornecedores_receberam_centavos ?? 0)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
