"use client";

import { useState } from "react";
import {
  patchAccountMeAction,
  patchSupplierProfileAction,
} from "@/app/(painel)/painel/_actions/platform-me-actions";
import { FiscalDocumentFields } from "@/components/platform/fiscal-document-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformMe } from "@/lib/platform-account-server";
import { capTaxIdDigits, type FiscalDocumentKind } from "@/lib/fiscal-document";
import { applyViaCepOnBlur, onlyCepDigits } from "@/lib/viacep";

type Props = {
  initial: NonNullable<PlatformMe["supplierProfile"]>;
  fiscalKind: FiscalDocumentKind;
  fiscalDocumentDigits: string;
};

export function FornecedorProfileForm({ initial, fiscalKind: initialKind, fiscalDocumentDigits }: Props) {
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [cep, setCep] = useState(initial.cep);
  const [phone, setPhone] = useState(initial.phone);
  const [addressLine1, setAddressLine1] = useState(initial.addressLine1);
  const [addressComplement, setAddressComplement] = useState(initial.addressComplement ?? "");
  const [city, setCity] = useState(initial.city);
  const [stateUf, setStateUf] = useState(initial.stateUf);
  const [fiscalKind, setFiscalKind] = useState<FiscalDocumentKind>(initialKind);
  const [fiscalDigits, setFiscalDigits] = useState(() =>
    capTaxIdDigits(initialKind, fiscalDocumentDigits),
  );
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setPending(true);
    try {
      await patchAccountMeAction({
        fiscalDocumentKind: fiscalKind,
        fiscalDocument: fiscalDigits,
      });
      await patchSupplierProfileAction({
        businessName,
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
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <FiscalDocumentFields
        idPrefix="fornecedor-fiscal"
        kind={fiscalKind}
        documentDigits={fiscalDigits}
        onKindChange={(k) => {
          setFiscalKind(k);
          setFiscalDigits((d) => capTaxIdDigits(k, d));
        }}
        onDocumentDigitsChange={setFiscalDigits}
        disabled={pending}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Razão social</Label>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="bg-background" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>CEP</Label>
          <Input
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            onBlur={(e) =>
              void applyViaCepOnBlur(e.currentTarget.value, (v) => {
                setCep(onlyCepDigits(v.cep));
                if (v.logradouro) setAddressLine1(v.logradouro);
                if (v.localidade) setCity(v.localidade);
                if (v.uf) setStateUf(v.uf.slice(0, 2).toUpperCase());
                const extra = [v.complemento, v.bairro ? `Bairro: ${v.bairro}` : ""].filter(Boolean).join(" · ");
                if (extra) setAddressComplement((c) => (c?.trim() ? `${c.trim()} · ${extra}` : extra));
              })
            }
            disabled={pending}
            className="max-w-[14rem] bg-background"
          />
          <p className="text-xs text-muted-foreground">Com 8 dígitos, a busca no ViaCEP ocorre ao sair do campo.</p>
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
