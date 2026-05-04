import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FornecedorImageUploadDemo } from "@/components/upload/fornecedor-image-upload-demo";
import { FornecedorInsumosPanel } from "@/components/fornecedor/fornecedor-insumos-panel";
import { FornecedorProfileForm } from "@/components/fornecedor/fornecedor-profile-form";
import { StripeConnectButton } from "@/components/platform/stripe-connect-button";
import { DEMO_SUPPLY_ITEMS } from "@/lib/demo-seed";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { fetchPlatformMe, fetchSupplyItemsForSession } from "@/lib/platform-account-server";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Fornecedor",
};

export default async function FornecedorPainelPage() {
  const session = await getSession();
  const email = session?.email ?? "";
  const apiOn = commerceUsesDatabase();
  const apiList =
    apiOn && session?.role === "SUPPLIER" && session?.sub
      ? await fetchSupplyItemsForSession()
      : null;
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fornecedor</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Insumos e custos para composição das peças. Com a API ativa e login pela base, você
          cadastra e edita itens aqui; eles entram no catálogo usado pelo admin nas combinações.
        </p>
      </div>

      {me?.supplierProfile ? (
        <Card className="max-w-4xl border-border">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Cadastro e pagamentos</CardTitle>
            <CardDescription>
              Dados da empresa e conexão Stripe para recebimentos após aprovação do admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FornecedorProfileForm initial={me.supplierProfile} />
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Stripe Connect</p>
              <StripeConnectButton
                onboardingComplete={me.stripeOnboardingComplete}
                hasStripeAccount={me.hasStripeAccount}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="max-w-4xl border-border">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Meus insumos</CardTitle>
          <CardDescription>
            {meusInsumos.length} item(ns) para{" "}
            <span className="text-foreground">{email}</span>
            {apiMode ? " (API)" : " (demonstração no navegador)"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FornecedorInsumosPanel initialItems={meusInsumos} apiMode={apiMode} />
        </CardContent>
      </Card>

      <FornecedorImageUploadDemo />
    </div>
  );
}
