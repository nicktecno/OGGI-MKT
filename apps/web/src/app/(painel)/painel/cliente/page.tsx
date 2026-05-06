import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};

export default async function PainelClientePage() {
  const session = await getSession();
  if (!session) redirect("/entrar?next=/painel/cliente");
  if (session.role !== "CUSTOMER") redirect("/painel");

  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-border/60 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Comprador</p>
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          Olá, {session.name ?? session.email}
        </h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          Acompanhe seus pedidos na {SITE_NAME}, atualize seu perfil e volte à loja quando quiser.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/painel/cliente/pedidos"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-auto min-h-[4.5rem] flex-col items-start justify-center gap-1 py-4 text-left",
          )}
        >
          <span className="font-medium">Meus pedidos</span>
          <span className="text-xs font-normal text-muted-foreground">Histórico e detalhes</span>
        </Link>
        <Link
          href="/painel/cliente/perfil"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-auto min-h-[4.5rem] flex-col items-start justify-center gap-1 py-4 text-left",
          )}
        >
          <span className="font-medium">Perfil</span>
          <span className="text-xs font-normal text-muted-foreground">Nome na conta</span>
        </Link>
        <Link
          href="/loja"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-auto min-h-[4.5rem] flex-col items-start justify-center gap-1 py-4 text-left sm:col-span-2",
          )}
        >
          <span className="font-medium">Ir à loja</span>
          <span className="text-xs font-normal opacity-90">Ver novidades e montar o carrinho</span>
        </Link>
      </div>
    </div>
  );
}
