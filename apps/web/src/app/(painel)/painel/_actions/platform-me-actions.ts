"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth-token";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { serverApiUrl } from "@/lib/server-api-url";

async function bearer(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export type StripeConnectResult = { url: string | null; message?: string };

const MSG_CONNECT_NAO_ATIVO_PT =
  "O Stripe Connect ainda não está ativado na conta Stripe da plataforma (a mesma da chave secreta na API). " +
  "Quem gere o site deve abrir https://dashboard.stripe.com/settings/connect , ativar o Connect para a entidade da plataforma e, em teste, confirmar no modo teste. " +
  "Depois, volte aqui e clique outra vez em «Conectar conta Stripe».";

function rawApiMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const m = (body as { message?: unknown }).message;
  if (typeof m === "string") return m;
  if (Array.isArray(m)) return m.map(String).join(" ");
  return "";
}

/** Converte mensagens típicas em inglês do Stripe em texto útil em português. */
function userFacingStripeConnectMessage(raw: string): string {
  const t = raw.trim();
  if (
    /signed up for Connect|only create new accounts.*Connect|You can only create new accounts|dashboard\.stripe\.com\/connect/i.test(
      t,
    )
  ) {
    return MSG_CONNECT_NAO_ATIVO_PT;
  }
  return t || "Erro ao iniciar Stripe.";
}

export async function startStripeConnectAction(): Promise<StripeConnectResult> {
  if (!commerceUsesDatabase()) {
    return { url: null, message: "API não configurada." };
  }
  const token = await bearer();
  if (!token) return { url: null, message: "Sessão expirada." };
  const res = await fetch(`${serverApiUrl()}/public/stripe/account-link`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as StripeConnectResult;
  if (!res.ok) {
    return { url: null, message: userFacingStripeConnectMessage(rawApiMessage(data)) };
  }
  if (!data.url && data.message) {
    return { url: null, message: userFacingStripeConnectMessage(data.message) };
  }
  return data;
}

export async function patchSupplierProfileAction(body: {
  businessName?: string;
  cep?: string;
  phone?: string;
  addressLine1?: string;
  addressComplement?: string;
  city?: string;
  stateUf?: string;
}) {
  const token = await bearer();
  if (!token) throw new Error("Sessão expirada.");
  const res = await fetch(`${serverApiUrl()}/accounts/me/supplier`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath("/painel/fornecedor");
}

export async function patchExecutorProfileAction(body: {
  displayName?: string;
  cep?: string;
  phone?: string;
  addressLine1?: string;
  addressComplement?: string;
  city?: string;
  stateUf?: string;
}) {
  const token = await bearer();
  if (!token) throw new Error("Sessão expirada.");
  const res = await fetch(`${serverApiUrl()}/accounts/me/executor`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  revalidatePath("/painel/executor");
}
