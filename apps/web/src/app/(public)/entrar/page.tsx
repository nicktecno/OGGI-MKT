import Image from "next/image";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { safeInternalPath } from "@/lib/safe-redirect";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Entrar",
  description: `Entre na sua conta ${SITE_NAME} para acompanhar pedidos, painel de fornecedor ou executor e dados da loja.`,
};

type PageProps = {
  searchParams: Promise<{ next?: string; cadastro?: string; senha?: string }>;
};

export default async function EntrarPage({ searchParams }: PageProps) {
  const { next, cadastro, senha } = await searchParams;
  const redirectTo = safeInternalPath(next, "/");
  const showPendingHint = cadastro === "pendente";
  const showClienteHint = cadastro === "cliente";
  const showSenhaRedefinida = senha === "redefinida";

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
        <div className="absolute bottom-10 left-10 max-w-md">
          <p className="font-serif text-3xl font-light leading-tight tracking-tight text-foreground drop-shadow-sm">
            Moda feita com carinho, por quem costura com alma.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="w-full max-w-md">
          {showClienteHint ? (
            <p className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-center text-sm text-muted-foreground">
              Conta de cliente criada. Entre com o e-mail e a senha que você escolheu para comprar na
              loja.
            </p>
          ) : null}
          {showPendingHint ? (
            <p className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-center text-sm text-muted-foreground">
              Cadastro recebido. Use o e-mail e a senha que você criou para entrar; o painel completo
              libera após aprovação do admin.
            </p>
          ) : null}
          {showSenhaRedefinida ? (
            <p className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-center text-sm text-muted-foreground">
              Senha atualizada. Entre com o e-mail e a nova senha.
            </p>
          ) : null}
          {redirectTo !== "/" ? (
            <p className="mb-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-center text-sm text-muted-foreground">
              Após entrar você será redirecionado para{" "}
              <span className="font-mono text-foreground">{redirectTo}</span>
            </p>
          ) : null}
          <LoginForm redirectTo={redirectTo !== "/" ? redirectTo : undefined} />
        </div>
      </div>
    </div>
  );
}
