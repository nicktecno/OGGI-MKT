import { IceCream, LayoutDashboard, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { LogoutButton } from "@/components/auth/logout-button";
import { FestAssistantChat } from "@/components/loslos-fest/fest-assistant-chat";
import { HeaderFestCartLink } from "@/components/loslos-fest/header-fest-cart-link";
import { LoslosLogo } from "@/components/loslos-fest/loslos-logo";
import { dashboardPathForRole } from "@/lib/auth-types";
import { getSession } from "@/lib/session";
import { SITE_BRAND, SITE_NAME } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function sessionHeaderLabel(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const name = session.name?.trim();
  return {
    display: name || session.email,
    title: name ? `${name} · ${session.email}` : session.email,
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const userInHeader = session ? sessionHeaderLabel(session) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteJsonLd />
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-md">
        <div className="relative mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:min-h-[5rem] sm:px-8 lg:px-12">
          <LoslosLogo variant="white" priority className="h-14 sm:h-16 md:h-18" />
          <nav className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2 sm:gap-x-5">
            <Link
              href="/fest"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <IceCream className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Montar pedido</span>
              <span className="sm:hidden">Pedido</span>
            </Link>
            <Link
              href="/contato"
              title="Contato"
              aria-label="Contato"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-primary"
            >
              <Mail className="h-5 w-5" aria-hidden />
            </Link>
            <HeaderFestCartLink />
            {session && userInHeader ? (
              <>
                <Link
                  href={dashboardPathForRole(session.role)}
                  title="Painel"
                  aria-label="Painel"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-primary"
                >
                  <LayoutDashboard className="h-5 w-5" aria-hidden />
                </Link>
                <LogoutButton className="shrink-0 rounded-full px-5 text-xs font-bold uppercase" />
              </>
            ) : (
              <Link
                href="/entrar"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-full border-2 border-primary font-bold uppercase tracking-wide text-primary hover:bg-primary hover:text-primary-foreground",
                )}
              >
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden />
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-card text-foreground">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div>
              <LoslosLogo variant="white" href="/" className="h-12 mb-2" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {SITE_BRAND}
              </p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Leve o carrinho de sorvete Los Los para sua festa. Combine os sabores como quiser e surpreenda seus convidados.
            </p>
          </div>
          <p className="mt-8 text-center text-xs uppercase tracking-widest text-muted-foreground sm:text-left">
            © {new Date().getFullYear()} {SITE_BRAND}
          </p>
        </div>
      </footer>
      <FestAssistantChat />
    </div>
  );
}
