import { commerceUsesDatabase } from "./commerce-backend";
import type { ExecutorPickerOption } from "./demo-seed";
import { serverApiUrl } from "./server-api-url";

function internalSecret(): string {
  return process.env.INTERNAL_API_SECRET ?? "";
}

async function platformInternalFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${serverApiUrl()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-internal-secret": internalSecret(),
      ...(init?.headers as Record<string, string>),
    },
    cache: "no-store",
  });
  return res;
}

export function platformInternalConfigured(): boolean {
  return commerceUsesDatabase();
}

export async function fetchPendingRegistrationsCount(): Promise<number> {
  if (!platformInternalConfigured()) return 0;
  const res = await platformInternalFetch("/internal/platform/accounts/pending-count");
  if (!res.ok) return 0;
  const j = (await res.json()) as { count?: number };
  return typeof j.count === "number" ? j.count : 0;
}

/** Costureiras com cadastro ativo (API + banco). Lista vazia se a chamada falhar. */
export async function fetchActiveExecutorPickerOptions(): Promise<ExecutorPickerOption[]> {
  if (!platformInternalConfigured()) return [];
  const res = await platformInternalFetch("/internal/platform/accounts/executors");
  if (!res.ok) return [];
  const j = (await res.json()) as { executors?: ExecutorPickerOption[] };
  if (!Array.isArray(j.executors)) return [];
  return j.executors.map((e) => ({
    email: String(e.email).trim().toLowerCase(),
    displayName: String(e.displayName ?? "").trim(),
  }));
}
