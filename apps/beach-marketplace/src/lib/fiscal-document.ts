export type FiscalDocumentKind = "CPF" | "CNPJ";

export function stripTaxIdDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function capTaxIdDigits(kind: FiscalDocumentKind, digits: string): string {
  const d = stripTaxIdDigits(digits);
  return kind === "CPF" ? d.slice(0, 11) : d.slice(0, 14);
}

export function formatTaxIdDisplay(kind: FiscalDocumentKind, digits: string): string {
  const d = capTaxIdDigits(kind, digits);
  if (kind === "CPF") {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
