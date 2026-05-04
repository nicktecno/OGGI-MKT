"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patchExecutorProfileAction } from "@/app/(painel)/painel/_actions/platform-me-actions";
import type { PlatformMe } from "@/lib/platform-account-server";

type Props = { initial: NonNullable<PlatformMe["executorProfile"]> };

export function ExecutorProfileForm({ initial }: Props) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [cep, setCep] = useState(initial.cep);
  const [phone, setPhone] = useState(initial.phone);
  const [addressLine1, setAddressLine1] = useState(initial.addressLine1);
  const [addressComplement, setAddressComplement] = useState(initial.addressComplement ?? "");
  const [city, setCity] = useState(initial.city);
  const [stateUf, setStateUf] = useState(initial.stateUf);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    try {
      await patchExecutorProfileAction({
        displayName,
        cep,
        phone,
        addressLine1,
        addressComplement: addressComplement || undefined,
        city,
        stateUf,
      });
      setMsg("Dados salvos.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Nome público (vitrine)</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label>CEP</Label>
          <Input value={cep} onChange={(e) => setCep(e.target.value)} className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Endereço</Label>
          <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="bg-background" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Complemento</Label>
          <Input
            value={addressComplement}
            onChange={(e) => setAddressComplement(e.target.value)}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label>UF</Label>
          <Input value={stateUf} onChange={(e) => setStateUf(e.target.value)} maxLength={2} className="bg-background" />
        </div>
      </div>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvando…" : "Salvar cadastro"}
      </Button>
    </form>
  );
}
