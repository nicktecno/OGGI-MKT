import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FornecedorWorkspace } from "@/components/fornecedor/fornecedor-workspace";
import { FornecedorProfileForm } from "@/components/fornecedor/fornecedor-profile-form";
import { StripeConnectButton } from "@/components/platform/stripe-connect-button";
import { DEMO_SUPPLY_ITEMS } from "@/lib/demo-seed";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import {
  fetchPlatformMe,
  fetchSupplierFulfillmentForSession,
  fetchSupplyItemsForSession,
} from "@/lib/platform-account-server";
import { dashboardPathForRole } from "@/lib/auth-types";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Fornecedor",
};

type PageProps = {
  searchParams: Promise<{ aba?: string }>;
};

function fornecedorSection(aba: string | undefined): "overview" | "dados" | "insumos" | "entregas" {
  if (aba === "entregas") return "entregas";
  if (aba === "insumos") return "insumos";
  if (aba === "dados") return "dados";
  return "overview";
}

export default async function FornecedorPainelPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const section = fornecedorSection(sp?.aba);
  const session = await getSession();
  const email = session?.email ?? "";
  const apiOn = commerceUsesDatabase();
  const apiList =
    apiOn && session?.role === "SUPPLIER" && session?.sub
      ? await fetchSupplyItemsForSession()
      : null;
  const fulfillmentLines =
    apiOn && session?.role === "SUPPLIER" && session?.sub
      ? (await fetchSupplierFulfillmentForSession()) ?? []
      : [];
  const me = apiOn ? await fetchPlatformMe() : null;

  const useApiSupplies =
    apiOn &&
    session?.role === "SUPPLIER" &&
    Boolean(session?.sub) &&
    apiList !== null;
  const meusInsumos = useApiSupplies
    ? apiList
    : DEMO_SUPPLY_ITEMS.filter((i) => i.supplierEmail === email);
  const apiMode = Boolean(useApiSupplies);
  const painelBase = dashboardPathForRole("SUPPLIER");

  const intro =
    section === "dados" ? (
      <>
        Razão social, morada, contactos e Stripe ficam nesta aba, à parte dos insumos e das entregas.
      </>
    ) : section === "insumos" ? (
      <>
        Cadastre insumos (foto, tipo metro/peça, quantidade) para o admin montar as peças. Os dados da
        empresa e pagamentos estão na aba <strong>Dados da empresa</strong>.
      </>
    ) : section === "entregas" ? (
      <>
        Quando uma combinação usar os seus insumos, veja o destino do envio ao executor; com o Melhor Envio
        ligado, a etiqueta fica disponível aqui.
      </>
    ) : (
      <>
        Escolha no menu à esquerda: dados da empresa e Stripe, insumos para as peças, ou entregas aos
        executores.
      </>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fornecedor</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{intro}</p>
      </div>

      {section === "dados" ? (
        <Card className="max-w-4xl border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Cadastro e pagamentos</CardTitle>
            <CardDescription>
              Dados da empresa e conexão Stripe para recebimentos após aprovação do admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {me?.supplierProfile ? (
              <>
                <FornecedorProfileForm initial={me.supplierProfile} />
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-sm font-medium text-foreground">Stripe Connect</p>
                  <StripeConnectButton
                    onboardingComplete={me.stripeOnboardingComplete}
                    hasStripeAccount={me.hasStripeAccount}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {apiOn
                  ? "O perfil de fornecedor ainda não está disponível para edição. Assim que a conta estiver ativa na plataforma, os campos aparecem aqui."
                  : "No modo demonstração, ligue a API e inicie sessão com um fornecedor aprovado para ver e editar o cadastro completo."}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-4xl border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl">
              {section === "insumos"
                ? "Meus insumos"
                : section === "entregas"
                  ? "Entregas aos executores"
                  : "Área de trabalho"}
            </CardTitle>
            <CardDescription>
              {section === "overview" ? (
                <>
                  Conta <span className="text-foreground">{email}</span>
                  {apiMode ? " · dados em API + banco" : " · modo demonstração"}.
                </>
              ) : section === "insumos" ? (
                <>
                  {meusInsumos.length} insumo(s) cadastrado(s) para{" "}
                  <span className="text-foreground">{email}</span>
                  {apiMode ? " (API + banco)" : " (demonstração)"}.
                </>
              ) : (
                <>
                  Envios ligados às suas matérias-primas para executores.{" "}
                  <span className="text-foreground">{fulfillmentLines.length}</span> linha(s) listada(s).
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={<PageLoadingFallback className="py-10" indicatorHeight={80} />}
            >
              <FornecedorWorkspace
                section={section}
                painelBase={painelBase}
                apiMode={apiMode}
                meusInsumos={meusInsumos}
                fulfillmentLines={fulfillmentLines}
                email={email}
              />
            </Suspense>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
