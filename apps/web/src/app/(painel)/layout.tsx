import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/ui/page-loading-fallback";
import { dashboardPathForRole } from "@/lib/auth-types";
import { getSession } from "@/lib/session";
import { SITE_NAME } from "@/lib/site";
import { PainelAsideLoadingFallback } from "./painel-aside-loading-fallback";
import { PainelSidebarWithNavCounts } from "./painel-sidebar-data";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/entrar");

  const painelHome = dashboardPathForRole(session.role);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-border/60 bg-card/55 px-5 py-6 backdrop-blur-md md:sticky md:top-0 md:flex md:h-screen md:max-h-screen md:w-60 md:shrink-0 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:border-r-foreground/[0.06] md:py-10 lg:w-64">
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
      <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/25">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <Suspense
            fallback={
              <PageLoadingFallback
                className="min-h-[52vh] py-12 sm:min-h-[48vh]"
                indicatorHeight={128}
                visibleMessage="A carregar o painel…"
              />
            }
          >
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
