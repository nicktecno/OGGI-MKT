import Link from "next/link";
import { Suspense } from "react";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { LogoutButton } from "@/components/auth/logout-button";
import { HeaderCartLink } from "@/components/loja/header-cart-link";
import { HeaderStoreSearchFallback } from "@/components/loja/header-store-search-fallback";
import { HeaderStoreSearch } from "@/components/loja/header-store-search";
import { dashboardPathForRole } from "@/lib/auth-types";
import { getSession } from "@/lib/session";
import { SITE_NAME } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function sessionHeaderLabel(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const name = session.name?.trim();
  return {
    /** Texto visível no header */
    display: name || session.email,
    /** Tooltip: nome + e-mail quando houver nome */
    title: name ? `${name} · ${session.email}` : session.email,
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const userInHeader = session ? sessionHeaderLabel(session) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteJsonLd />
      <header className="sticky top-0 z-40 border-b border-foreground/[0.07] bg-background/65 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/50">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
        <div className="relative mx-auto flex min-h-[4rem] max-w-7xl flex-col gap-3 px-5 py-3 sm:min-h-[4.25rem] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0 sm:px-8 lg:px-12">
          <Link href="/" className="group flex shrink-0 flex-col justify-center gap-0.5 sm:py-1">
            <span className="font-serif text-xl font-medium tracking-[0.02em] text-foreground transition-colors group-hover:text-foreground/80 sm:text-2xl">
              {SITE_NAME}
            </span>
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.34em] text-muted-foreground">
              Moda artesanal
            </span>
          </Link>
          <div className="order-last min-w-0 w-full sm:order-none sm:max-w-md sm:flex-1 lg:max-w-xl">
            <Suspense fallback={<HeaderStoreSearchFallback />}>
              <HeaderStoreSearch />
            </Suspense>
          </div>
          <nav className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2 sm:gap-x-8 md:gap-x-10">
            <Link
              href="/loja"
              className="shrink-0 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-accent"
            >
              Loja
            </Link>
            <Link
              href="/contato"
              className="shrink-0 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-accent"
            >
              Contato
            </Link>
            <HeaderCartLink />
            {session && userInHeader ? (
              <>
                <Link
                  href={dashboardPathForRole(session.role)}
                  className="shrink-0 text-[0.8125rem] font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Painel
                </Link>
                <span
                  className="hidden max-w-[10rem] shrink-0 truncate text-xs text-muted-foreground/90 lg:inline"
                  title={userInHeader.title}
                >
                  {userInHeader.display}
                </span>
                <LogoutButton className="shrink-0 rounded-full px-5 text-xs uppercase tracking-[0.12em]" />
              </>
            ) : (
              <Link
                href="/entrar"
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "shrink-0 rounded-full px-6 text-xs font-medium uppercase tracking-[0.14em]",
                )}
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-foreground/[0.06] bg-gradient-to-b from-muted/30 via-muted/20 to-background">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
          <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div>
              <p className="font-serif text-2xl font-medium tracking-tight text-foreground">{SITE_NAME}</p>
              <p className="mt-2 text-[0.625rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Curadoria &amp; ofício
              </p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Peças selecionadas de artesãos independentes. Compra segura e suporte humano.
            </p>
          </div>
          <p className="mt-6 text-center sm:mt-4 sm:text-left">
            <Link href="/contato" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
              Fale conosco
            </Link>
          </p>
          <div className="mx-auto mt-10 h-px max-w-xs bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="mt-8 text-center text-[0.625rem] uppercase tracking-[0.26em] text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}
