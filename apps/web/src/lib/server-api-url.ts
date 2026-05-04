/** URL base da API Nest (somente servidor). */
export function serverApiUrl(): string {
  const raw = process.env.COMMERCE_API_URL ?? process.env.SERVER_API_URL ?? "";
  return raw.replace(/\/$/, "");
}

export function serverApiConfigured(): boolean {
  return Boolean(serverApiUrl() && (process.env.INTERNAL_API_SECRET ?? "").trim());
}
