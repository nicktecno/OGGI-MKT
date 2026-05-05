"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_CARD, ADMIN_CARD_HEADER } from "@/components/admin/admin-panel-styles";
import { cn } from "@/lib/utils";
import { approvePlatformAccount, rejectPlatformAccount } from "../platform-admin-actions";

export type PendingPlatformAccount = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  supplierProfile: {
    businessName: string;
    cep: string;
    phone: string;
    addressLine1: string;
    city: string;
    stateUf: string;
  } | null;
  executorProfile: {
    displayName: string;
    cep: string;
    phone: string;
    addressLine1: string;
    city: string;
    stateUf: string;
  } | null;
};

export function CadastrosModeracaoClient({ initial }: { initial: PendingPlatformAccount[] }) {
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  async function approve(id: string) {
    setError(null);
    setBusyId(id);
    try {
      await approvePlatformAccount(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao aprovar");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setError(null);
    const reason = (rejectReason[id] ?? "").trim() || "Cadastro recusado.";
    setBusyId(id);
    try {
      await rejectPlatformAccount(id, reason);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao recusar");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-muted/15 px-5 py-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/[0.02]">
        Nenhum cadastro aguardando aprovação no momento.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
          {error}
        </p>
      ) : null}
      <div className="space-y-5">
        {items.map((row) => (
          <Card key={row.id} className={cn(ADMIN_CARD, "overflow-hidden")}>
            <CardHeader className={cn(ADMIN_CARD_HEADER)}>
              <CardTitle className="font-serif text-lg md:text-xl">
                {row.name}{" "}
                <span className="font-sans text-sm font-normal text-muted-foreground">
                  ({row.role === "SUPPLIER" ? "Fornecedor" : "Executor"})
                </span>
              </CardTitle>
              <CardDescription className="font-mono text-xs">{row.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {row.supplierProfile ? (
                <div className="rounded-xl border border-border/50 bg-muted/15 p-4 text-muted-foreground ring-1 ring-foreground/[0.02]">
                  <p className="font-medium text-foreground">{row.supplierProfile.businessName}</p>
                  <p>
                    {row.supplierProfile.addressLine1}, {row.supplierProfile.city} —{" "}
                    {row.supplierProfile.stateUf}
                  </p>
                  <p>CEP {row.supplierProfile.cep}</p>
                  <p>{row.supplierProfile.phone}</p>
                </div>
              ) : null}
              {row.executorProfile ? (
                <div className="rounded-xl border border-border/50 bg-muted/15 p-4 text-muted-foreground ring-1 ring-foreground/[0.02]">
                  <p className="font-medium text-foreground">{row.executorProfile.displayName}</p>
                  <p>
                    {row.executorProfile.addressLine1}, {row.executorProfile.city} —{" "}
                    {row.executorProfile.stateUf}
                  </p>
                  <p>CEP {row.executorProfile.cep}</p>
                  <p>{row.executorProfile.phone}</p>
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor={`motivo-${row.id}`}>Motivo (se recusar)</Label>
                  <Input
                    id={`motivo-${row.id}`}
                    value={rejectReason[row.id] ?? ""}
                    onChange={(e) =>
                      setRejectReason((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                    placeholder="Opcional"
                    className="bg-background"
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyId === row.id}
                    onClick={() => reject(row.id)}
                  >
                    Recusar
                  </Button>
                  <Button type="button" disabled={busyId === row.id} onClick={() => approve(row.id)}>
                    Aprovar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
