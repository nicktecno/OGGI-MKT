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
      <p className="text-sm text-muted-foreground">
        Nenhum cadastro aguardando aprovação no momento.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="space-y-4">
        {items.map((row) => (
          <Card key={row.id} className="border-border">
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                {row.name}{" "}
                <span className="font-sans text-sm font-normal text-muted-foreground">
                  ({row.role === "SUPPLIER" ? "Fornecedor" : "Executor"})
                </span>
              </CardTitle>
              <CardDescription className="font-mono text-xs">{row.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {row.supplierProfile ? (
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-muted-foreground">
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
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-muted-foreground">
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
