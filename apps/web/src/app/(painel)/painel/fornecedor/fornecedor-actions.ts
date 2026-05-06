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
  quantidadeKind: "METRO" | "PECA";
  quantidade: number;
  custoFornecedor?: number;
  freteAteExecutor?: number;
  observacao?: string;
  imagemUrl?: string;
  ativo?: boolean;
  pacoteAlturaCm?: number;
  pacoteLarguraCm?: number;
  pacoteComprimentoCm?: number;
  pacotePesoKg?: number;
}) {
  if (!commerceUsesDatabase()) {
    throw new Error("Cadastro de insumos exige API com banco de dados e integração interna ativas.");
  }
  const token = await bearer();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const body: Record<string, unknown> = {
    nome: input.nome,
    skuInterno: input.skuInterno,
    quantidadeKind: input.quantidadeKind,
    quantidade: input.quantidade,
    observacao: input.observacao,
    imagemUrl: input.imagemUrl,
    ativo: input.ativo ?? true,
    pacoteAlturaCm: input.pacoteAlturaCm,
    pacoteLarguraCm: input.pacoteLarguraCm,
    pacoteComprimentoCm: input.pacoteComprimentoCm,
    pacotePesoKg: input.pacotePesoKg,
  };
  if (input.custoFornecedor !== undefined) body.custoFornecedor = input.custoFornecedor;
  if (input.freteAteExecutor !== undefined) body.freteAteExecutor = input.freteAteExecutor;

  const res = await fetch(`${serverApiUrl()}/supply-items`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Erro ${res.status}`);
  }
  revalidatePath("/painel/fornecedor");
  return (await res.json()) as { id: string };
}

export async function deleteSupplyItemAction(id: string) {
  if (!commerceUsesDatabase()) {
    throw new Error("Remover insumos exige API com banco de dados e integração interna ativas.");
  }
  const token = await bearer();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const res = await fetch(`${serverApiUrl()}/supply-items/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = await res.text();
    try {
      const j = JSON.parse(msg) as { message?: string | string[] };
      if (typeof j.message === "string") msg = j.message;
      else if (Array.isArray(j.message)) msg = j.message.join(", ");
    } catch {
      /* keep text */
    }
    throw new Error(msg || `Erro ${res.status}`);
  }
  revalidatePath("/painel/fornecedor");
  revalidatePath("/painel/admin", "layout");
}

export async function updateSupplyItemAction(
  id: string,
  input: {
    nome?: string;
    skuInterno?: string;
    quantidadeKind?: "METRO" | "PECA";
    quantidade?: number;
    custoFornecedor?: number;
    freteAteExecutor?: number;
    observacao?: string;
    imagemUrl?: string;
    ativo?: boolean;
    pacoteAlturaCm?: number;
    pacoteLarguraCm?: number;
    pacoteComprimentoCm?: number;
    pacotePesoKg?: number;
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

export async function uploadSupplyItemImageAction(supplyItemId: string, formData: FormData) {
  if (!commerceUsesDatabase()) {
    throw new Error("Upload exige API ativa.");
  }
  const token = await bearer();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    throw new Error("Selecione uma imagem.");
  }
  const out = new FormData();
  out.append("file", file);
  const res = await fetch(
    `${serverApiUrl()}/supply-items/${encodeURIComponent(supplyItemId)}/image`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: out,
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Erro ${res.status}`);
  }
  revalidatePath("/painel/fornecedor");
  return (await res.json()) as { url: string };
}
