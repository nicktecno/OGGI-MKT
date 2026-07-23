/** Dados de entrega coletados no checkout (sessionStorage no cliente). */

export type CheckoutDelivery = {
  recipientName: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
};

const UF = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
  "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function isCheckoutDeliveryComplete(d: Partial<CheckoutDelivery> | null | undefined): d is CheckoutDelivery {
  if (!d || typeof d !== "object") return false;
  const t = (s: unknown) => (typeof s === "string" ? s.trim() : "");
  const recipientName = t(d.recipientName);
  const phone = t(d.phone);
  const cepRaw = t(d.cep);
  const street = t(d.street);
  const number = t(d.number);
  const neighborhood = t(d.neighborhood);
  const city = t(d.city);
  const uf = t(d.uf).toUpperCase();
  const cep = digitsOnly(cepRaw);
  if (recipientName.length < 3) return false;
  if (phone.length < 8) return false;
  if (cep.length !== 8) return false;
  if (street.length < 3) return false;
  if (number.length < 1) return false;
  if (neighborhood.length < 2) return false;
  if (city.length < 2) return false;
  if (uf.length !== 2 || !UF.has(uf)) return false;
  return true;
}

export function normalizeCheckoutDelivery(d: CheckoutDelivery): CheckoutDelivery {
  return {
    recipientName: d.recipientName.trim(),
    phone: d.phone.trim(),
    cep: digitsOnly(d.cep),
    street: d.street.trim(),
    number: d.number.trim(),
    complement: d.complement.trim(),
    neighborhood: d.neighborhood.trim(),
    city: d.city.trim(),
    uf: d.uf.trim().toUpperCase(),
  };
}
