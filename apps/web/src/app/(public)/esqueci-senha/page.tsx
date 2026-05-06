import type { Metadata } from "next";
import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Esqueci a senha",
  description: `Recupere o acesso à sua conta ${SITE_NAME} por e-mail.`,
};

export default function EsqueciSenhaPage() {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-2">
      <div className="relative hidden min-h-[420px] lg:block">
        <Image
          src={MARKETING_IMAGES.entrarSide}
          alt="Moda editorial"
          fill
          className="object-cover"
          sizes="50vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>
      <div className="flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
