"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ADMIN_CART_MODELS,
  resetAdminCatalogToSeed,
  writeAdminCatalog,
  type AdminCatalog,
} from "@/lib/loslos-fest/admin-catalog-storage";
import { useFestCatalog } from "@/lib/loslos-fest/use-fest-catalog";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

export function useLoslosFestAdminPersist() {
  const catalog = useFestCatalog();
  const [saved, setSaved] = useState(false);

  const persist = useCallback((next: AdminCatalog) => {
    writeAdminCatalog(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return { catalog, persist, saved };
}

export function LoslosFestAdminToolbar({
  catalog,
  saved,
}: {
  catalog: AdminCatalog;
  saved: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-primary/15 bg-muted/50 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-primary">{catalog.lines.length}</span> linhas ·{" "}
        <span className="font-semibold text-primary">{catalog.templates.length}</span> modelos ·{" "}
        <span className="font-semibold text-primary">{catalog.stores.length}</span> filiais
        <span className="ml-2 text-xs">
          (atualizado {new Date(catalog.updatedAt).toLocaleString("pt-BR")})
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => resetAdminCatalogToSeed()}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Restaurar padrão
        </Button>
        {saved ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            Salvo na vitrine
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function LoslosFestCartsCard() {
  return (
    <Card className="border-primary/15">
      <CardHeader>
        <CardTitle className="text-base">Carrinhos (somente leitura)</CardTitle>
        <CardDescription>Modelos 200 e 300 unidades — configurados no código neste mock.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        {ADMIN_CART_MODELS.map((c) => (
          <p key={c.id} className="rounded-lg border border-border/60 px-3 py-2">
            <strong>{c.name}</strong> — {c.capacity} un.
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

export function LoslosFestAdminOverview() {
  const { catalog, saved } = useLoslosFestAdminPersist();

  const links = [
    { href: "/painel/admin/loslos-fest/imagens", label: "Imagens da home", count: catalog.homeImages?.heroSlides?.length ?? 0 },
    { href: "/painel/admin/loslos-fest/linhas", label: "Linhas de sorvete", count: catalog.lines.length },
    { href: "/painel/admin/loslos-fest/modelos", label: "Modelos", count: catalog.templates.length },
    { href: "/painel/admin/loslos-fest/filiais", label: "Filiais (retirada)", count: catalog.stores.length },
  ];

  return (
    <div className="space-y-6">
      <LoslosFestAdminToolbar catalog={catalog} saved={saved} />
      <div className="grid gap-4 sm:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border-2 border-primary/15 bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <p className="font-heading text-xs font-extrabold uppercase tracking-wide text-primary">
              {item.label}
            </p>
            <p className="mt-2 font-heading text-3xl font-black text-foreground">{item.count}</p>
            <p className="mt-2 text-sm text-muted-foreground">Gerenciar →</p>
          </Link>
        ))}
      </div>
      <LoslosFestCartsCard />
      <Link href="/fest" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
        Ver vitrine pública
      </Link>
    </div>
  );
}
