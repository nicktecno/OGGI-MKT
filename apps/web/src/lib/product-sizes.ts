/** Tamanhos de roupa disponíveis na criação da peça (ordem de exibição). */
export const ROUPA_TAMANHOS = ["P", "M", "G", "GG", "XG", "Único"] as const;
export type RoupaTamanho = (typeof ROUPA_TAMANHOS)[number];

const LETTERS = new Set(["P", "M", "G", "GG", "XG"]);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function canonicalSize(raw: string): RoupaTamanho | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (stripAccents(trimmed).toLowerCase() === "unico") return "Único";
  const up = trimmed.toUpperCase();
  if (LETTERS.has(up)) return up as RoupaTamanho;
  return null;
}

/** Filtra valores inválidos, remove duplicados e mantém a ordem P → XG → Único. */
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
