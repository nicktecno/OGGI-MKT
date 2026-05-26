/** Preset de cadastro via query `?parceiro=costureira|fornecedor`. */
export type RegisterPartnerPreset = "costureira" | "fornecedor";

export function parseRegisterPartnerPreset(
  raw: string | string[] | undefined,
): RegisterPartnerPreset | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const q = v?.trim().toLowerCase();
  if (q === "costureira" || q === "executor") return "costureira";
  if (q === "fornecedor" || q === "supplier") return "fornecedor";
  return undefined;
}
