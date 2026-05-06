import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nova senha",
  description: `Defina uma nova senha para a sua conta ${SITE_NAME}.`,
};

function ResetFallback() {
  return (
    <div className="rounded-lg border border-border/80 bg-card/95 p-8 text-center text-sm text-muted-foreground shadow-xl backdrop-blur-sm">
      Carregando…
    </div>
  );
}

export default function RecuperarSenhaPage() {
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
          <Suspense fallback={<ResetFallback />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
