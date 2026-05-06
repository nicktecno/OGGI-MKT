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

/** Painel lateral tipo “tab rail”: faixa escura com itens em destaque. */
function SidebarTabRail({ "aria-label": ariaLabel, children }: { "aria-label": string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-muted/35 p-1",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:bg-muted/25 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
      )}
    >
      <nav className="flex flex-col gap-px" aria-label={ariaLabel}>
        {children}
      </nav>
    </div>
  );
}

function sidebarTabClass(active: boolean) {
  return cn(
    "group flex w-full min-w-0 items-center justify-between gap-2 rounded-md border-l-[3px] py-2.5 pl-2.5 pr-3 text-left text-[0.8125rem] font-medium leading-snug transition-colors duration-150 sm:text-sm",
    active
      ? "border-l-primary bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.06]"
      : "border-l-transparent text-muted-foreground hover:border-l-transparent hover:bg-background/55 hover:text-foreground",
  );
}

export function PainelSidebar({ role, painelHome, adminNavCounts }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (role === "ADMIN" && adminNavCounts) {
    type AdminNavItem =
      | { href: "/painel/admin/cadastro-peca"; label: "Cadastro de peça" }
      | { href: "/painel/admin/pecas"; label: "Peças e preços" }
      | { href: "/painel/admin/financeiro"; label: "Financeiro (Stripe)" }
      | { href: "/painel/admin/cadastros"; label: "Cadastros"; badge: number }
      | { href: "/painel/admin/pedidos"; label: "Pedidos das costureiras"; badge: number }
      | { href: "/painel/admin/combinacoes"; label: "Quem faz o quê"; badge: number };

    const items: AdminNavItem[] = [
      { href: "/painel/admin/cadastro-peca", label: "Cadastro de peça" },
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

    const lojaActive = pathname === "/loja" || pathname.startsWith("/loja/");

    return (
      <div className="flex w-full flex-col gap-3">
        <SidebarTabRail aria-label="Menu da administração">
          {items.map((item) => {
            const active = pathname === item.href;
            const badge = "badge" in item ? item.badge : 0;
            return (
              <Link key={item.href} href={item.href} prefetch className={sidebarTabClass(active)}>
                <span className="min-w-0 flex-1">{item.label}</span>
                {badge > 0 ? (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1 text-[0.65rem] font-semibold tabular-nums",
                      active
                        ? "bg-primary/12 text-primary"
                        : "bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/15 group-hover:text-foreground",
                    )}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <div className="my-1 mx-2 h-px bg-border/60" role="separator" />
          <Link href="/loja" className={sidebarTabClass(lojaActive)}>
            <span className="min-w-0 flex-1">Loja pública</span>
          </Link>
        </SidebarTabRail>
      </div>
    );
  }

  if (role === "SUPPLIER") {
    const aba = searchParams.get("aba");
    const onFornecedor =
      pathname === painelHome || (painelHome !== "/" && pathname.startsWith(`${painelHome}/`));
    const overviewActive =
      onFornecedor && aba !== "insumos" && aba !== "entregas" && aba !== "dados";
    const dadosActive = aba === "dados";
    const insumosActive = aba === "insumos";
    const entregasActive = aba === "entregas";
    const lojaActive = pathname === "/loja" || pathname.startsWith("/loja/");

    return (
      <SidebarTabRail aria-label="Menu do fornecedor">
        <Link href={painelHome} prefetch className={sidebarTabClass(overviewActive)}>
          <span className="min-w-0 flex-1">Visão geral</span>
        </Link>
        <Link href={`${painelHome}?aba=dados`} prefetch className={sidebarTabClass(dadosActive)}>
          <span className="min-w-0 flex-1">Dados da empresa</span>
        </Link>
        <Link href={`${painelHome}?aba=insumos`} prefetch className={sidebarTabClass(insumosActive)}>
          <span className="min-w-0 flex-1">Meus insumos</span>
        </Link>
        <Link href={`${painelHome}?aba=entregas`} prefetch className={sidebarTabClass(entregasActive)}>
          <span className="min-w-0 flex-1">Entregas aos executores</span>
        </Link>
        <div className="my-1 mx-2 h-px bg-border/60" role="separator" />
        <Link href="/loja" className={sidebarTabClass(lojaActive)}>
          <span className="min-w-0 flex-1">Loja pública</span>
        </Link>
      </SidebarTabRail>
    );
  }

  const overviewActive =
    pathname === painelHome || (painelHome !== "/" && pathname.startsWith(`${painelHome}/`));
  const lojaActive = pathname === "/loja" || pathname.startsWith("/loja/");

  return (
    <SidebarTabRail aria-label="Menu do painel">
      <Link href={painelHome} className={sidebarTabClass(overviewActive)}>
        <span className="min-w-0 flex-1">Visão geral</span>
      </Link>
      <div className="my-1 mx-2 h-px bg-border/60" role="separator" />
      <Link href="/loja" className={sidebarTabClass(lojaActive)}>
        <span className="min-w-0 flex-1">Loja pública</span>
      </Link>
    </SidebarTabRail>
  );
}
