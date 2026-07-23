"use client";

import { useState } from "react";
import { patchAccountMeAction } from "@/app/(painel)/painel/_actions/platform-me-actions";
import { FiscalDocumentFields } from "@/components/platform/fiscal-document-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { capTaxIdDigits, type FiscalDocumentKind } from "@/lib/fiscal-document";

type Props = {
  initialName: string;
  initialFiscalKind: FiscalDocumentKind;
  initialFiscalDigits: string;
};

export function AdminAccountProfileForm({
  initialName,
  initialFiscalKind,
  initialFiscalDigits,
}: Props) {
  const [name, setName] = useState(initialName);
  const [fiscalKind, setFiscalKind] = useState<FiscalDocumentKind>(initialFiscalKind);
  const [fiscalDigits, setFiscalDigits] = useState(() =>
    capTaxIdDigits(initialFiscalKind, initialFiscalDigits),
  );
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    try {
      await patchAccountMeAction({
        name: name.trim(),
        fiscalDocumentKind: fiscalKind,
        fiscalDocument: fiscalDigits,
      });
      setMsg("Dados salvos.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="max-w-lg space-y-5">
      <div className="space-y-2">
        <Label htmlFor="admin-me-name">Nome</Label>
        <Input
          id="admin-me-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={120}
          required
          disabled={pending}
          className="bg-background"
        />
      </div>
      <FiscalDocumentFields
        idPrefix="admin-fiscal"
        kind={fiscalKind}
        documentDigits={fiscalDigits}
        onKindChange={(k) => {
          setFiscalKind(k);
          setFiscalDigits((d) => capTaxIdDigits(k, d));
        }}
        onDocumentDigitsChange={setFiscalDigits}
        disabled={pending}
      />
      {msg ? (
        <p className={`text-sm ${msg.includes("Erro") || msg.toLowerCase().includes("invál") ? "text-destructive" : "text-muted-foreground"}`}>
          {msg}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
