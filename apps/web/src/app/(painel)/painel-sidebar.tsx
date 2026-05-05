"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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

function linkClass(active: boolean, opts?: { compact?: boolean }) {
  return cn(
    "rounded-md px-3 py-2.5 transition-colors",
    opts?.compact
      ? "w-full min-w-0 py-2 text-left text-sm leading-snug md:mx-0"
      : "text-base md:-mx-1",
    active
      ? "bg-muted/80 font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

export function PainelSidebar({ role, painelHome, adminNavCounts }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  if (role === "SUPPLIER") {
    const aba = searchParams.get("aba");
    const onFornecedor =
      pathname === painelHome || (painelHome !== "/" && pathname.startsWith(`${painelHome}/`));
    const overviewActive = onFornecedor && aba !== "insumos" && aba !== "entregas";
    const insumosActive = aba === "insumos";
    const entregasActive = aba === "entregas";
    const lojaActive = pathname === "/loja" || pathname.startsWith("/loja/");

    return (
      <nav className="flex w-full flex-col gap-1" aria-label="Menu do fornecedor">
        <Link href={painelHome} className={linkClass(overviewActive, { compact: true })}>
          Visão geral
        </Link>
        <Link href={`${painelHome}?aba=insumos`} className={linkClass(insumosActive, { compact: true })}>
          Meus insumos
        </Link>
        <Link href={`${painelHome}?aba=entregas`} className={linkClass(entregasActive, { compact: true })}>
          Entregas aos executores
        </Link>
        <Link href="/loja" className={linkClass(lojaActive, { compact: true })}>
          Loja pública
        </Link>
      </nav>
    );
  }

  const overviewActive =
    pathname === painelHome || (painelHome !== "/" && pathname.startsWith(`${painelHome}/`));

  return (
    <nav className="flex w-full flex-col gap-1" aria-label="Menu do painel">
      <Link href={painelHome} className={linkClass(overviewActive, { compact: true })}>
        Visão geral
      </Link>
      <Link
        href="/loja"
        className={linkClass(pathname === "/loja" || pathname.startsWith("/loja/"), { compact: true })}
      >
        Loja pública
      </Link>
    </nav>
  );
}
