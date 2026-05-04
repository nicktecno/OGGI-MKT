"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { serverApiUrl } from "@/lib/server-api-url";
import { commerceUsesDatabase } from "@/lib/commerce-backend";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Só quem administra a loja pode fazer esta ação.");
  }
  return session;
}

function internalSecret(): string {
  return process.env.INTERNAL_API_SECRET ?? "";
}

async function internalFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${serverApiUrl()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-internal-secret": internalSecret(),
      ...(init?.headers as Record<string, string>),
    },
    cache: "no-store",
  });
}

export async function approvePlatformAccount(accountId: string) {
  await requireAdmin();
  if (!commerceUsesDatabase()) {
    throw new Error("Aprovação de cadastro exige API e Postgres configurados.");
  }
  const session = await getSession();
  const res = await internalFetch(`/internal/platform/accounts/${encodeURIComponent(accountId)}/approve`, {
    method: "POST",
    body: JSON.stringify({ reviewedByEmail: session?.email }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Erro ${res.status}`);
  }
  revalidatePath("/painel/admin/cadastros");
  revalidatePath("/painel", "layout");
}

export async function rejectPlatformAccount(accountId: string, reason: string) {
  await requireAdmin();
  if (!commerceUsesDatabase()) {
    throw new Error("Moderação de cadastro exige API e Postgres configurados.");
  }
  const session = await getSession();
  const res = await internalFetch(`/internal/platform/accounts/${encodeURIComponent(accountId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason, reviewedByEmail: session?.email }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Erro ${res.status}`);
  }
  revalidatePath("/painel/admin/cadastros");
  revalidatePath("/painel", "layout");
}
