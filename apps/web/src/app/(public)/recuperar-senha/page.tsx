import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nova senha",
  description: `Defina uma nova senha para a sua conta ${SITE_NAME}.`,
};

function ResetFallback() {
  return (
    <AuthFormShell title="Carregando…" description="Aguarde um instante.">
      <p className="text-center text-sm text-muted-foreground">Preparando formulário…</p>
    </AuthFormShell>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <AuthPageLayout quote="Escolha uma nova senha forte para proteger sua conta Los Los Fest.">
      <Suspense fallback={<ResetFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageLayout>
  );
}
