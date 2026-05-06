import { BadRequestException } from '@nestjs/common';

export type FiscalDocumentKind = 'CPF' | 'CNPJ';

export function stripTaxIdDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function isValidCpf(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]!, 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(digits[9]!, 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]!, 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(digits[10]!, 10);
}

export function isValidCnpj(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]!, 10) * w1[i]!;
  let r = sum % 11;
  const d1 = r < 2 ? 0 : 11 - r;
  if (d1 !== parseInt(digits[12]!, 10)) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]!, 10) * w2[i]!;
  r = sum % 11;
  const d2 = r < 2 ? 0 : 11 - r;
  return d2 === parseInt(digits[13]!, 10);
}

/** Normaliza e valida; devolve só dígitos. */
export function assertValidFiscalDocument(kind: FiscalDocumentKind, raw: string): string {
  const digits = stripTaxIdDigits(raw);
  if (kind === 'CPF') {
    if (!isValidCpf(digits)) {
      throw new BadRequestException('CPF inválido.');
    }
    return digits;
  }
  if (!isValidCnpj(digits)) {
    throw new BadRequestException('CNPJ inválido.');
  }
  return digits;
}

export function formatFiscalDocumentForDisplay(kind: FiscalDocumentKind, digits: string): string {
  const d = stripTaxIdDigits(digits);
  if (kind === 'CPF' && d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (kind === 'CNPJ' && d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return digits;
}
