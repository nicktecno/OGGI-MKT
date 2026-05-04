import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Cadastro não aprovado",
};

export default async function ContaRecusadaPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
        Cadastro não aprovado
      </h1>
      <p className="text-muted-foreground">
        A conta <span className="font-medium text-foreground">{session?.email}</span> não foi
        aprovada para uso na plataforma. Se acredita que foi um engano, entre em contato com o
        suporte.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <LogoutButton className="rounded-full px-6 text-xs uppercase tracking-[0.12em]" />
        <Link
          href="/registrar"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Tentar novo cadastro
        </Link>
      </div>
    </div>
  );
}
