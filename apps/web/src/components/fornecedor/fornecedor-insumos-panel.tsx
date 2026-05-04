"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DemoSupplyItem } from "@/lib/demo-seed";
import { insumoCostTotal } from "@/lib/demo-seed";
import { formatBrl } from "@/lib/utils";
import {
  createSupplyItemAction,
  updateSupplyItemAction,
} from "@/app/(painel)/painel/fornecedor/fornecedor-actions";

type Props = {
  initialItems: DemoSupplyItem[];
  apiMode: boolean;
};

function parseMoney(s: string): number {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function FornecedorInsumosPanel({ initialItems, apiMode }: Props) {
  const items = initialItems;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [unidade, setUnidade] = useState("m");
  const [custo, setCusto] = useState("");
  const [frete, setFrete] = useState("");

  function resetForm() {
    setNome("");
    setSku("");
    setUnidade("m");
    setCusto("");
    setFrete("");
    setEditingId(null);
  }

  async function onCreate() {
    if (!apiMode) return;
    setError(null);
    const c = parseMoney(custo);
    const f = parseMoney(frete);
    if (!nome.trim() || !sku.trim() || !unidade.trim() || c < 0 || f < 0 || Number.isNaN(c) || Number.isNaN(f)) {
      setError("Preencha nome, SKU, unidade e valores numéricos válidos.");
      return;
    }
    setPending(true);
    try {
      await createSupplyItemAction({
        nome: nome.trim(),
        skuInterno: sku.trim(),
        unidade: unidade.trim(),
        custoFornecedor: c,
        freteAteExecutor: f,
        ativo: true,
      });
      resetForm();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setPending(false);
    }
  }

  async function onUpdate(row: DemoSupplyItem) {
    if (!apiMode) return;
    setError(null);
    const c = parseMoney(custo);
    const f = parseMoney(frete);
    if (!nome.trim() || !sku.trim() || !unidade.trim() || c < 0 || f < 0 || Number.isNaN(c) || Number.isNaN(f)) {
      setError("Confira os campos antes de salvar.");
      return;
    }
    setPending(true);
    try {
      await updateSupplyItemAction(row.id, {
        nome: nome.trim(),
        skuInterno: sku.trim(),
        unidade: unidade.trim(),
        custoFornecedor: c,
        freteAteExecutor: f,
      });
      resetForm();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setPending(false);
    }
  }

  function startEdit(row: DemoSupplyItem) {
    setEditingId(row.id);
    setNome(row.nome);
    setSku(row.sku_interno);
    setUnidade(row.unidade);
    setCusto(String(row.custo_fornecedor));
    setFrete(String(row.frete_ate_executor));
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {apiMode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editingId) void onCreate();
          }}
          className="space-y-4 rounded-lg border border-border bg-muted/15 p-4"
        >
          <h3 className="text-sm font-medium text-foreground">
            {editingId ? "Editar insumo" : "Novo insumo"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ins-nome">Nome</Label>
              <Input id="ins-nome" value={nome} onChange={(e) => setNome(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-sku">SKU interno</Label>
              <Input id="ins-sku" value={sku} onChange={(e) => setSku(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-un">Unidade</Label>
              <Input id="ins-un" value={unidade} onChange={(e) => setUnidade(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-custo">Custo fornecedor (R$)</Label>
              <Input id="ins-custo" value={custo} onChange={(e) => setCusto(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-frete">Frete até executor (R$)</Label>
              <Input id="ins-frete" value={frete} onChange={(e) => setFrete(e.target.value)} className="bg-background" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {editingId ? (
              <>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const row = items.find((i) => i.id === editingId);
                    if (row) void onUpdate(row);
                  }}
                >
                  Salvar alterações
                </Button>
                <Button type="button" variant="ghost" disabled={pending} onClick={resetForm}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Cadastrar insumo"}
              </Button>
            )}
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Modo demonstração: os insumos vêm do seed. Com a API ativada e sessão pela base de dados,
          você cadastra e edita insumos aqui.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 font-medium text-right">Custo</th>
              <th className="px-4 py-3 font-medium text-right">Frete</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              {apiMode ? <th className="px-4 py-3 font-medium text-right">Ações</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((row) => (
              <tr key={row.id} className="bg-card hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground">{row.nome}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.sku_interno}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.unidade}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatBrl(row.custo_fornecedor)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatBrl(row.frete_ate_executor)}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                  {formatBrl(insumoCostTotal(row))}
                </td>
                {apiMode ? (
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>
                      Editar
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
