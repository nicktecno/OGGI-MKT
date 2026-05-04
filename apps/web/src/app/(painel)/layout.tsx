import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { dashboardPathForRole } from "@/lib/auth-types";
import { getSession } from "@/lib/session";
import { SITE_NAME } from "@/lib/site";
import { PainelAsideLoadingFallback } from "./painel-aside-loading-fallback";
import { PainelSidebarWithNavCounts } from "./painel-sidebar-data";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/entrar");

  const painelHome = dashboardPathForRole(session.role);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-border/70 bg-card/40 px-5 py-6 backdrop-blur-sm md:flex md:w-56 md:flex-col md:border-b-0 md:border-r md:py-10 lg:w-60">
        <div className="mb-8">
          <Link href="/" className="font-serif text-xl text-foreground/90 transition-colors hover:text-foreground">
            {SITE_NAME}
          </Link>
          <p className="mt-1 text-[0.625rem] uppercase tracking-[0.28em] text-muted-foreground">Painel</p>
        </div>
        <Suspense fallback={<PainelAsideLoadingFallback />}>
          <PainelSidebarWithNavCounts role={session.role} painelHome={painelHome} />
        </Suspense>
      </aside>
      <div className="flex-1 bg-gradient-to-b from-background via-background to-muted/15">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
