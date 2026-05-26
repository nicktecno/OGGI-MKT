import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminAccountProfileForm } from "@/components/admin/admin-account-profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { roleDisplayLabel } from "@/lib/auth-types";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import type { FiscalDocumentKind } from "@/lib/fiscal-document";
import { fetchPlatformMe } from "@/lib/platform-account-server";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};

export default async function AdminContaPage() {
  const session = await getSession();
  if (!session) redirect("/entrar?next=/painel/admin/conta");
  if (session.role !== "ADMIN") redirect("/painel");

  const me = commerceUsesDatabase() ? await fetchPlatformMe() : null;
  if (!me) redirect("/painel/admin");

  const fiscalKind = (me.fiscalDocumentKind === "CNPJ" ? "CNPJ" : "CPF") as FiscalDocumentKind;

  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-border/60 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {roleDisplayLabel("ADMIN")}
        </p>
        <h1 className="font-serif text-3xl font-medium tracking-tight">Minha conta</h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          Nome e documento fiscal (CPF ou CNPJ) da conta de administrador.
        </p>
      </header>

      <Card className="max-w-2xl border-border/80">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Dados da conta</CardTitle>
          <CardDescription>Os mesmos campos exigidos aos outros perfis da plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAccountProfileForm
            initialName={me.name}
            initialFiscalKind={fiscalKind}
            initialFiscalDigits={me.fiscalDocument ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
