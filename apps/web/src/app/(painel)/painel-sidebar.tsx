"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth-types";
import { cn } from "@/lib/utils";

export type AdminNavCounts = {
  pendingRegistrationsCount: number;
  pendingRequestsCount: number;
  activeCombinationsCount: number;
};

type Props = {
  role: Role;
  painelHome: string;
  adminNavCounts?: AdminNavCounts;
};

function linkClass(active: boolean) {
  return cn(
    "rounded-md px-3 py-2.5 text-base transition-colors md:-mx-1",
    active
      ? "bg-muted/80 font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

export function PainelSidebar({ role, painelHome, adminNavCounts }: Props) {
  const pathname = usePathname();

  if (role === "ADMIN" && adminNavCounts) {
    type AdminNavItem =
      | { href: "/painel/admin/pecas"; label: "Peças e preços" }
      | { href: "/painel/admin/financeiro"; label: "Financeiro (Stripe)" }
      | { href: "/painel/admin/cadastros"; label: "Cadastros"; badge: number }
      | { href: "/painel/admin/pedidos"; label: "Pedidos das costureiras"; badge: number }
      | { href: "/painel/admin/combinacoes"; label: "Quem faz o quê"; badge: number };

    const items: AdminNavItem[] = [
      { href: "/painel/admin/pecas", label: "Peças e preços" },
      { href: "/painel/admin/financeiro", label: "Financeiro (Stripe)" },
      {
        href: "/painel/admin/cadastros",
        label: "Cadastros",
        badge: adminNavCounts.pendingRegistrationsCount,
      },
      {
        href: "/painel/admin/pedidos",
        label: "Pedidos das costureiras",
        badge: adminNavCounts.pendingRequestsCount,
      },
      {
        href: "/painel/admin/combinacoes",
        label: "Quem faz o quê",
        badge: adminNavCounts.activeCombinationsCount,
      },
    ];

    return (
      <nav className="flex flex-row flex-wrap items-center gap-1.5">
        {items.map((item) => {
          const active = pathname === item.href;
          const badge = "badge" in item ? item.badge : 0;
          return (
            <Link key={item.href} href={item.href} className={linkClass(active)}>
              <span className="flex items-center justify-between gap-2">
                <span>{item.label}</span>
                {badge > 0 ? (
                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 px-1.5 text-xs font-bold text-accent">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
        <Link
          href="/loja"
          className={linkClass(pathname === "/loja" || pathname.startsWith("/loja/"))}
        >
          Loja pública
        </Link>
      </nav>
    );
  }

  const overviewActive =
    pathname === painelHome || (painelHome !== "/" && pathname.startsWith(`${painelHome}/`));

  return (
    <nav className="flex flex-row flex-wrap items-center gap-1.5">
      <Link href={painelHome} className={linkClass(overviewActive)}>
        Visão geral
      </Link>
      <Link
        href="/loja"
        className={linkClass(pathname === "/loja" || pathname.startsWith("/loja/"))}
      >
        Loja pública
      </Link>
    </nav>
  );
}
