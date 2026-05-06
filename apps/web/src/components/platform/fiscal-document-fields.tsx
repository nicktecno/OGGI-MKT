"use client";

import { Label } from "@/components/ui/label";
import {
  capTaxIdDigits,
  formatTaxIdDisplay,
  type FiscalDocumentKind,
} from "@/lib/fiscal-document";
import { cn } from "@/lib/utils";

type Props = {
  kind: FiscalDocumentKind;
  documentDigits: string;
  onKindChange: (k: FiscalDocumentKind) => void;
  onDocumentDigitsChange: (digits: string) => void;
  disabled?: boolean;
  idPrefix?: string;
};

export function FiscalDocumentFields({
  kind,
  documentDigits,
  onKindChange,
  onDocumentDigitsChange,
  disabled,
  idPrefix = "fiscal",
}: Props) {
  const idDoc = `${idPrefix}-doc`;
  const idKind = `${idPrefix}-kind`;

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
      <div className="space-y-2">
        <Label id={idKind} className="text-foreground">
          Documento fiscal
        </Label>
        <p className="text-xs text-muted-foreground">
          Escolha CPF (pessoa física) ou CNPJ (pessoa jurídica) e informe o número completo.
        </p>
        <div
          className="flex max-w-md items-center gap-3 rounded-lg border border-border bg-background/80 p-1.5"
          role="group"
          aria-labelledby={idKind}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onKindChange("CPF");
              onDocumentDigitsChange(capTaxIdDigits("CPF", documentDigits));
            }}
            className={cn(
              "min-h-9 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              kind === "CPF"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            CPF
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onKindChange("CNPJ");
              onDocumentDigitsChange(capTaxIdDigits("CNPJ", documentDigits));
            }}
            className={cn(
              "min-h-9 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              kind === "CNPJ"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            CNPJ
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={idDoc}>{kind === "CPF" ? "CPF" : "CNPJ"}</Label>
        <input
          id={idDoc}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={formatTaxIdDisplay(kind, documentDigits)}
          onChange={(e) => {
            const next = capTaxIdDigits(kind, e.target.value);
            onDocumentDigitsChange(next);
          }}
          className={cn(
            "flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          placeholder={kind === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
        />
      </div>
    </div>
  );
}
