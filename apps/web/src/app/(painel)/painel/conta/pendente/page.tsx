import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { roleDisplayLabel } from "@/lib/auth-types";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Cadastro em análise",
};

export default async function ContaPendentePage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
        Cadastro em análise
      </h1>
      <p className="text-sm font-medium text-primary">
        Perfil: {session ? roleDisplayLabel(session.role) : "—"}
      </p>
      <p className="text-muted-foreground">
        Recebemos o cadastro de <span className="font-medium text-foreground">{session?.email}</span>.
        Em breve a equipe revisa os dados e libera o acesso completo ao painel.
      </p>
      <p className="text-sm text-muted-foreground">
        Você receberá acesso a insumos, produção e pagamentos assim que o status mudar para ativo.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <LogoutButton className="rounded-full px-6 text-xs uppercase tracking-[0.12em]" />
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}
