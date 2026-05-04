import Image from "next/image";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Criar conta",
  description: `Cadastro de fornecedor ou executor — ${SITE_NAME}.`,
};

export default function RegistrarPage() {
  const apiEnabled = commerceUsesDatabase();

  return (
    <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-2">
      <div className="relative hidden min-h-[420px] lg:block">
        <Image
          src={MARKETING_IMAGES.entrarSide}
          alt=""
          fill
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-10 left-10 max-w-md">
          <p className="font-serif text-3xl font-light leading-tight tracking-tight text-foreground drop-shadow-sm">
            Junte-se a quem faz a moda acontecer, com transparência e cuidado.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md space-y-4">
          {!apiEnabled ? (
            <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center text-sm text-muted-foreground">
              O cadastro online não está disponível neste ambiente: é preciso a API com banco de dados
              e a integração servidor-a-servidor ativadas na configuração do deploy.
            </p>
          ) : null}
          <RegisterForm apiEnabled={apiEnabled} />
        </div>
      </div>
    </div>
  );
}
