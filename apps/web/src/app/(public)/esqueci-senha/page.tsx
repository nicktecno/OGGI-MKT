import type { Metadata } from "next";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Esqueci a senha",
  description: `Recupere o acesso à sua conta ${SITE_NAME} por e-mail.`,
};

export default function EsqueciSenhaPage() {
  return (
    <AuthPageLayout quote="Informe seu e-mail e enviaremos um link seguro para redefinir sua senha.">
      <ForgotPasswordForm />
    </AuthPageLayout>
  );
}
