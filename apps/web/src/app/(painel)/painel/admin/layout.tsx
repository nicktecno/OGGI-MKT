import type { Metadata } from "next";
import { Suspense } from "react";
import { commerceUsesDatabase } from "@/lib/demo-runtime";
import { cn } from "@/lib/utils";
import { AdminSectionFallback } from "./admin-section-fallback";

export const metadata: Metadata = {
  title: "Administração",
};

export default function AdminPainelLayout({ children }: { children: React.ReactNode }) {
  const apiOn = commerceUsesDatabase();
  const persistenceCopy = apiOn
    ? "As alterações são salvas no banco de dados pela API do servidor — o mesmo fluxo de produção."
    : "No modo demonstração sem API, as alterações ficam só neste navegador até você limpar os dados do site. Com a API e o banco ligados no deploy, tudo passa a ser persistido no servidor.";

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 via-card/50 to-muted/25 p-6 shadow-luxury-sm ring-1 ring-foreground/[0.04] sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-accent/[0.12] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-64 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="relative">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em]",
              apiOn
                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
            )}
          >
            {apiOn ? "API + banco ativos" : "Modo demonstração"}
          </span>
          <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Administração
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Pelo menu à esquerda você altera peças e preços, responde pedidos das costureiras e vê quem
            está fazendo cada modelo. {persistenceCopy}
          </p>
        </div>
      </div>
      <Suspense fallback={<AdminSectionFallback />}>{children}</Suspense>
    </div>
  );
}
