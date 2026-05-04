"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth-token";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import { serverApiUrl } from "@/lib/server-api-url";

async function bearer(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function createSupplyItemAction(input: {
  nome: string;
  skuInterno: string;
  unidade: string;
  custoFornecedor: number;
  freteAteExecutor: number;
  ativo?: boolean;
}) {
  if (!commerceUsesDatabase()) {
    throw new Error("Cadastro de insumos exige API com banco de dados e integração interna ativas.");
  }
  const token = await bearer();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const res = await fetch(`${serverApiUrl()}/supply-items`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nome: input.nome,
      skuInterno: input.skuInterno,
      unidade: input.unidade,
      custoFornecedor: input.custoFornecedor,
      freteAteExecutor: input.freteAteExecutor,
      ativo: input.ativo ?? true,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Erro ${res.status}`);
  }
  revalidatePath("/painel/fornecedor");
}

export async function updateSupplyItemAction(
  id: string,
  input: {
    nome?: string;
    skuInterno?: string;
    unidade?: string;
    custoFornecedor?: number;
    freteAteExecutor?: number;
    ativo?: boolean;
  },
) {
  if (!commerceUsesDatabase()) {
    throw new Error("Edição de insumos exige API com banco de dados e integração interna ativas.");
  }
  const token = await bearer();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const res = await fetch(`${serverApiUrl()}/supply-items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Erro ${res.status}`);
  }
  revalidatePath("/painel/fornecedor");
}
