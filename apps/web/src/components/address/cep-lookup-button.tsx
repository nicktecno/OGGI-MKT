"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchViaCepAddress, onlyCepDigits, type ViaCepAddress } from "@/lib/viacep";
import { cn } from "@/lib/utils";

type Props = {
  /** CEP atual (com ou sem máscara). */
  cep: string;
  disabled?: boolean;
  /** Preenche ruas/cidade/UF/etc. a partir do ViaCEP. */
  onFill: (data: ViaCepAddress) => void;
  className?: string;
  size?: "default" | "sm";
};

/**
 * Botão que consulta ViaCEP e devolve logradouro, bairro, localidade, UF e complemento.
 * O formulário pai mapeia para os seus campos (checkout, perfil, cadastro).
 */
export function CepLookupButton({ cep, disabled, onFill, className, size = "sm" }: Props) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  async function onClick() {
    setHint(null);
    if (onlyCepDigits(cep).length !== 8) {
      setHint("Informe 8 dígitos no CEP.");
      return;
    }
    setBusy(true);
    try {
      const data = await fetchViaCepAddress(cep);
      if (!data) {
        setHint("CEP não encontrado.");
        return;
      }
      onFill(data);
      setHint("Endereço preenchido.");
    } catch {
      setHint("Falha ao consultar. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button type="button" variant="outline" size={size} disabled={disabled || busy} onClick={() => void onClick()}>
        {busy ? "Buscando…" : "Buscar CEP (ViaCEP)"}
      </Button>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
