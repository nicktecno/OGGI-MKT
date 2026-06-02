import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSectionFallback } from "./admin-section-fallback";

export const metadata: Metadata = {
  title: "Administração Oggi Fest",
};

export const dynamic = "force-dynamic";

export default function AdminPainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/15 bg-gradient-to-br from-primary/5 via-white to-oggi-pink-light/40 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-primary">Painel administrador</p>
        <h1 className="mt-3 font-heading text-2xl font-black uppercase tracking-wide text-foreground md:text-3xl">
          Oggi Fest
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Use o menu à esquerda para cadastrar linhas, modelos e filiais. As alterações ficam neste
          navegador (mock) e refletem na vitrine ao salvar.
        </p>
      </div>
      <Suspense fallback={<AdminSectionFallback />}>{children}</Suspense>
    </div>
  );
}
