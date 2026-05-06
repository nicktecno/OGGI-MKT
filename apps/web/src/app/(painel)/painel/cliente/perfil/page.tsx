import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerProfileForm } from "@/components/customer/customer-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { fetchPlatformMe } from "@/lib/platform-account-server";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Perfil",
  robots: { index: false, follow: false },
};

export default async function PainelClientePerfilPage() {
  const session = await getSession();
  if (!session) redirect("/entrar?next=/painel/cliente/perfil");
  if (session.role !== "CUSTOMER") redirect("/painel");

  const me = commerceUsesDatabase() ? await fetchPlatformMe() : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-border/60 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Comprador</p>
        <h1 className="font-serif text-3xl font-medium tracking-tight">Perfil</h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          Dados básicos da sua conta de cliente.
        </p>
      </header>

      <Card className="max-w-lg border-border/80">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Dados pessoais</CardTitle>
          <CardDescription>
            {me
              ? "Atualize como quer ser chamado na loja."
              : "Com a API configurada, você pode editar o nome aqui."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {me ? (
            <CustomerProfileForm
              initialName={me.name}
              email={me.email}
              initialFiscalKind={me.fiscalDocumentKind === "CNPJ" ? "CNPJ" : "CPF"}
              initialFiscalDigits={me.fiscalDocument ?? ""}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Defina <code className="rounded bg-muted px-1">COMMERCE_API_URL</code> e o segredo interno
              no servidor para sincronizar o perfil com a API.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
