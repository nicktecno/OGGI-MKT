/** Resposta útil do ViaCEP (https://viacep.com.br/). */

export type ViaCepAddress = {
  /** CEP como devolvido pelo ViaCEP (ex.: 01310-100). */
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
};

export function onlyCepDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

/**
 * Consulta o CEP na API pública ViaCEP.
 * Funciona no browser (CORS liberado pelo serviço).
 */
export async function fetchViaCepAddress(cepRaw: string): Promise<ViaCepAddress | null> {
  const cep = onlyCepDigits(cepRaw);
  if (cep.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { method: "GET" });
  if (!res.ok) return null;

  const j = (await res.json()) as Record<string, unknown>;
  if (j.erro === true || j.erro === "true") return null;

  const logradouro = typeof j.logradouro === "string" ? j.logradouro.trim() : "";
  const bairro = typeof j.bairro === "string" ? j.bairro.trim() : "";
  const localidade = typeof j.localidade === "string" ? j.localidade.trim() : "";
  const uf = typeof j.uf === "string" ? j.uf.trim().toUpperCase() : "";
  const complemento = typeof j.complemento === "string" ? j.complemento.trim() : "";
  const cepFmt = typeof j.cep === "string" && j.cep.trim() ? j.cep.trim() : cep.replace(/(\d{5})(\d{3})/, "$1-$2");

  if (!localidade || uf.length !== 2) return null;

  return { cep: cepFmt, logradouro, bairro, localidade, uf, complemento };
}

/**
 * Com 8 dígitos no CEP, consulta ViaCEP ao sair do campo (`onBlur`) e chama `onFill` se encontrar.
 */
export async function applyViaCepOnBlur(
  cepRaw: string,
  onFill: (data: ViaCepAddress) => void,
): Promise<void> {
  if (onlyCepDigits(cepRaw).length !== 8) return;
  try {
    const data = await fetchViaCepAddress(cepRaw);
    if (data) onFill(data);
  } catch {
    /* rede ou CEP inválido: utilizador pode corrigir */
  }
}
