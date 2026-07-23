/** Evita open redirect: só caminhos relativos na mesma origem. */
export function safeInternalPath(next: unknown, fallback: string): string {
  if (typeof next !== "string") return fallback;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("://") || t.includes("\\")) return fallback;
  return t;
}
