"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Role } from "@/lib/auth-types";
import { cn } from "@/lib/utils";

type Props = {
  role: Role;
  painelHome: string;
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

function adminNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ADMIN_OGGI_FEST_ITEMS = [
  { href: "/painel/admin/oggi-fest", label: "Visão geral", exact: true as const },
  { href: "/painel/admin/oggi-fest/linhas", label: "Linhas de sorvete" },
  { href: "/painel/admin/oggi-fest/modelos", label: "Modelos" },
  { href: "/painel/admin/oggi-fest/filiais", label: "Filiais (retirada)" },
] as const;

export function PainelSidebar({ role, painelHome }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const vitrineActive =
    pathname === "/fest" || pathname.startsWith("/fest/");

  if (role === "ADMIN") {
    return (
      <div className="flex w-full flex-col gap-3">
        <SidebarTabRail aria-label="Menu Los Los Fest">
          {ADMIN_OGGI_FEST_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={sidebarTabClass(adminNavActive(pathname, item.href, "exact" in item && item.exact))}
            >
              <span className="min-w-0 flex-1">{item.label}</span>
            </Link>
          ))}
          <Link
            href="/painel/admin/conta"
            prefetch
            className={sidebarTabClass(pathname === "/painel/admin/conta")}
          >
            <span className="min-w-0 flex-1">Minha conta</span>
          </Link>
          <div className="my-1 mx-2 h-px bg-border/60" role="separator" />
          <Link href="/fest" prefetch className={sidebarTabClass(vitrineActive)}>
            <span className="min-w-0 flex-1">Ver vitrine</span>
          </Link>
        </SidebarTabRail>
      </div>
    );
  }

  if (role === "SUPPLIER") {
    const aba = searchParams.get("aba");
    const onFornecedor =
      pathname === painelHome || (painelHome !== "/" && pathname.startsWith(`${painelHome}/`));
    const overviewActive = onFornecedor && aba !== "insumos" && aba !== "entregas" && aba !== "dados";
    const dadosActive = aba === "dados";
    const insumosActive = aba === "insumos";
    const entregasActive = aba === "entregas";

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
          <span className="min-w-0 flex-1">Entregas</span>
        </Link>
        <div className="my-1 mx-2 h-px bg-border/60" role="separator" />
        <Link href="/fest" prefetch className={sidebarTabClass(vitrineActive)}>
          <span className="min-w-0 flex-1">Ver vitrine</span>
        </Link>
      </SidebarTabRail>
    );
  }

  if (role === "CUSTOMER") {
    const pedidosActive = pathname === "/painel/cliente/pedidos";
    const perfilActive = pathname === "/painel/cliente/perfil";
    const inicioActive = pathname === "/painel/cliente" || pathname === "/painel/cliente/";

    return (
      <SidebarTabRail aria-label="Menu da conta">
        <Link href="/painel/cliente" prefetch className={sidebarTabClass(inicioActive)}>
          <span className="min-w-0 flex-1">Início</span>
        </Link>
        <Link href="/painel/cliente/pedidos" prefetch className={sidebarTabClass(pedidosActive)}>
          <span className="min-w-0 flex-1">Meus pedidos</span>
        </Link>
        <Link href="/painel/cliente/perfil" prefetch className={sidebarTabClass(perfilActive)}>
          <span className="min-w-0 flex-1">Perfil</span>
        </Link>
        <div className="my-1 mx-2 h-px bg-border/60" role="separator" />
        <Link href="/fest" prefetch className={sidebarTabClass(vitrineActive)}>
          <span className="min-w-0 flex-1">Los Los Fest</span>
        </Link>
      </SidebarTabRail>
    );
  }

  if (role === "EXECUTOR") {
    const overviewActive =
      pathname === painelHome || (painelHome !== "/" && pathname.startsWith(`${painelHome}/`));

    return (
      <SidebarTabRail aria-label="Menu da costureira">
        <Link href={painelHome} className={sidebarTabClass(overviewActive)}>
          <span className="min-w-0 flex-1">Visão geral</span>
        </Link>
        <div className="my-1 mx-2 h-px bg-border/60" role="separator" />
        <Link href="/fest" prefetch className={sidebarTabClass(vitrineActive)}>
          <span className="min-w-0 flex-1">Ver vitrine</span>
        </Link>
      </SidebarTabRail>
    );
  }

  const overviewActive =
    pathname === painelHome || (painelHome !== "/" && pathname.startsWith(`${painelHome}/`));

  return (
    <SidebarTabRail aria-label="Menu do painel">
      <Link href={painelHome} className={sidebarTabClass(overviewActive)}>
        <span className="min-w-0 flex-1">Visão geral</span>
      </Link>
      <div className="my-1 mx-2 h-px bg-border/60" role="separator" />
      <Link href="/fest" prefetch className={sidebarTabClass(vitrineActive)}>
        <span className="min-w-0 flex-1">Ver vitrine</span>
      </Link>
    </SidebarTabRail>
  );
}
