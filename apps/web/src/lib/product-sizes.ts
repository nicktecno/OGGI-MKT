/** Tamanhos de roupa disponíveis na criação da peça (ordem de exibição). */
export const ROUPA_TAMANHOS = ["P", "M", "G", "GG", "XG"] as const;
export type RoupaTamanho = (typeof ROUPA_TAMANHOS)[number];

const ALLOWED = new Set<string>(ROUPA_TAMANHOS);

function canonicalSize(raw: string): RoupaTamanho | null {
  const t = raw.trim().toUpperCase();
  if (ALLOWED.has(t)) return t as RoupaTamanho;
  return null;
}

/** Filtra valores inválidos, remove duplicados e mantém a ordem P → XG. */
export function normalizeVariacoesTamanho(input: unknown): RoupaTamanho[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const x of input) {
    if (typeof x !== "string") continue;
    const c = canonicalSize(x);
    if (c) seen.add(c);
  }
  return ROUPA_TAMANHOS.filter((t) => seen.has(t));
}

export function formatVariacoesTamanhosLabel(sizes: string[] | undefined): string {
  const n = normalizeVariacoesTamanho(sizes ?? []);
  return n.join(" · ");
}
