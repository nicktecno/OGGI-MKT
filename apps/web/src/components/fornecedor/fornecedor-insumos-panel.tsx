"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createSupplyItemAction,
  deleteSupplyItemAction,
  updateSupplyItemAction,
  uploadSupplyItemImageAction,
} from "@/app/(painel)/painel/fornecedor/fornecedor-actions";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/upload/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompressImageMime } from "@/lib/compress-image-client";
import type { DemoSupplyItem } from "@/lib/demo-seed";
import { insumoCostTotal } from "@/lib/demo-seed";
import { formatBrl } from "@/lib/utils";

type Props = {
  initialItems: DemoSupplyItem[];
  apiMode: boolean;
  supplierEmail: string;
};

function parseMoney(s: string): number {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function parseQty(s: string): number {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function defaultPacote(row?: DemoSupplyItem) {
  return {
    altura: String(row?.pacote_altura_cm ?? 14),
    largura: String(row?.pacote_largura_cm ?? 12),
    comprimento: String(row?.pacote_comprimento_cm ?? 5),
    peso: String(row?.pacote_peso_kg ?? 0.4),
  };
}

export function FornecedorInsumosPanel({ initialItems, apiMode, supplierEmail }: Props) {
  const router = useRouter();
  const items = initialItems;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [quantidadeKind, setQuantidadeKind] = useState<"METRO" | "PECA">("METRO");
  const [quantidade, setQuantidade] = useState("1");
  const [custo, setCusto] = useState("");
  const [observacao, setObservacao] = useState("");
  const [pacAlt, setPacAlt] = useState("14");
  const [pacLar, setPacLar] = useState("12");
  const [pacComp, setPacComp] = useState("5");
  const [pacPeso, setPacPeso] = useState("0.4");
  const [pendingImageBlob, setPendingImageBlob] = useState<Blob | null>(null);
  const [pendingImageName, setPendingImageName] = useState<string | null>(null);
  const [pendingImageMime, setPendingImageMime] = useState<CompressImageMime | null>(null);

  function resetForm() {
    setNome("");
    setSku("");
    setQuantidadeKind("METRO");
    setQuantidade("1");
    setCusto("");
    setObservacao("");
    const d = defaultPacote();
    setPacAlt(d.altura);
    setPacLar(d.largura);
    setPacComp(d.comprimento);
    setPacPeso(d.peso);
    setPendingImageBlob(null);
    setPendingImageName(null);
    setPendingImageMime(null);
    setEditingId(null);
  }

  async function onCreate() {
    if (!apiMode) return;
    setError(null);
    const cRaw = custo.trim();
    const c = parseMoney(custo);
    const q = parseQty(quantidade);
    const pa = parseQty(pacAlt);
    const pl = parseQty(pacLar);
    const pc = parseQty(pacComp);
    const pp = parseQty(pacPeso);
    if (cRaw === "" || Number.isNaN(c) || c < 0) {
      setError("Informe o custo do fornecedor em R$ (número ≥ 0).");
      return;
    }
    if (!nome.trim() || !sku.trim() || Number.isNaN(q) || q <= 0) {
      setError("Preencha nome, SKU e quantidade válidos.");
      return;
    }
    if (
      Number.isNaN(pa) ||
      Number.isNaN(pl) ||
      Number.isNaN(pc) ||
      Number.isNaN(pp) ||
      pa < 0.1 ||
      pl < 0.1 ||
      pc < 0.1 ||
      pp < 0.01
    ) {
      setError("Pacote: dimensões ≥ 0,1 cm e peso ≥ 0,01 kg.");
      return;
    }
    setPending(true);
    try {
      const created = await createSupplyItemAction({
        nome: nome.trim(),
        skuInterno: sku.trim(),
        quantidadeKind,
        quantidade: q,
        custoFornecedor: c,
        observacao: observacao.trim() || undefined,
        pacoteAlturaCm: pa,
        pacoteLarguraCm: pl,
        pacoteComprimentoCm: pc,
        pacotePesoKg: pp,
      });
      if (pendingImageBlob && created?.id) {
        const fd = new FormData();
        const name = pendingImageName ?? "insumo.webp";
        const type = pendingImageMime ?? "image/webp";
        fd.append("file", new File([pendingImageBlob], name, { type }));
        await uploadSupplyItemImageAction(created.id, fd);
      }
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
    const cRaw = custo.trim();
    const c = parseMoney(custo);
    const q = parseQty(quantidade);
    const pa = parseQty(pacAlt);
    const pl = parseQty(pacLar);
    const pc = parseQty(pacComp);
    const pp = parseQty(pacPeso);
    if (cRaw === "" || Number.isNaN(c) || c < 0) {
      setError("Informe o custo do fornecedor em R$ (número ≥ 0).");
      return;
    }
    if (!nome.trim() || !sku.trim() || Number.isNaN(q) || q <= 0) {
      setError("Confira os campos antes de salvar.");
      return;
    }
    if (
      Number.isNaN(pa) ||
      Number.isNaN(pl) ||
      Number.isNaN(pc) ||
      Number.isNaN(pp) ||
      pa < 0.1 ||
      pl < 0.1 ||
      pc < 0.1 ||
      pp < 0.01
    ) {
      setError("Pacote: dimensões ≥ 0,1 cm e peso ≥ 0,01 kg.");
      return;
    }
    setPending(true);
    try {
      await updateSupplyItemAction(row.id, {
        nome: nome.trim(),
        skuInterno: sku.trim(),
        quantidadeKind,
        quantidade: q,
        custoFornecedor: c,
        observacao: observacao.trim() || undefined,
        pacoteAlturaCm: pa,
        pacoteLarguraCm: pl,
        pacoteComprimentoCm: pc,
        pacotePesoKg: pp,
      });
      if (pendingImageBlob) {
        const fd = new FormData();
        const name = pendingImageName ?? "insumo.webp";
        const type = pendingImageMime ?? "image/webp";
        fd.append("file", new File([pendingImageBlob], name, { type }));
        await uploadSupplyItemImageAction(row.id, fd);
      }
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
    setQuantidadeKind(row.quantidade_kind ?? (row.unidade === "pc" ? "PECA" : "METRO"));
    setQuantidade(String(row.quantidade ?? 1));
    setCusto(row.custo_fornecedor != null ? String(row.custo_fornecedor) : "");
    setObservacao(row.observacao ?? "");
    const d = defaultPacote(row);
    setPacAlt(d.altura);
    setPacLar(d.largura);
    setPacComp(d.comprimento);
    setPacPeso(d.peso);
    setPendingImageBlob(null);
    setPendingImageName(null);
    setPendingImageMime(null);
  }

  const kindLabel = quantidadeKind === "METRO" ? "Metros" : "Peças";

  async function onDelete(id: string) {
    if (!apiMode) return;
    if (
      !window.confirm(
        "Apagar este insumo definitivamente? Não é possível se estiver na montagem de alguma peça na loja.",
      )
    ) {
      return;
    }
    setError(null);
    setDeletingId(id);
    try {
      await deleteSupplyItemAction(id);
      if (editingId === id) resetForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível apagar.");
    } finally {
      setDeletingId(null);
    }
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
          <p className="text-xs text-muted-foreground leading-relaxed">
            O <strong>custo do fornecedor</strong> (R$) é obrigatório por insumo. O frete até a costureira é
            cotado pelo <strong>Melhor Envio</strong> quando o admin atribuir a peça a um executor. Informe
            o <strong>pacote</strong> típico deste insumo (para cotação); se vários insumos seus forem no
            mesmo envio, prevalece o de maior volume.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ins-nome">Título / nome do insumo</Label>
              <Input id="ins-nome" value={nome} onChange={(e) => setNome(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-sku">SKU interno</Label>
              <Input id="ins-sku" value={sku} onChange={(e) => setSku(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de quantidade</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={quantidadeKind === "METRO" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuantidadeKind("METRO")}
                >
                  Metros
                </Button>
                <Button
                  type="button"
                  variant={quantidadeKind === "PECA" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuantidadeKind("PECA")}
                >
                  Peça
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-qtd">Quantidade ({kindLabel.toLowerCase()})</Label>
              <Input
                id="ins-qtd"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="bg-background"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-custo">Custo fornecedor (R$) *</Label>
              <Input
                id="ins-custo"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
                required
                className="bg-background"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ins-obs">Observação (opcional)</Label>
              <Input
                id="ins-obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: largura do rolo, cor, lote…"
                className="bg-background"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 rounded-md border border-border/60 bg-background/50 p-3">
              <p className="text-xs font-medium text-foreground">Pacote do insumo (cm e kg)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ins-pac-a">Altura</Label>
                  <Input
                    id="ins-pac-a"
                    value={pacAlt}
                    onChange={(e) => setPacAlt(e.target.value)}
                    className="bg-background"
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ins-pac-l">Largura</Label>
                  <Input
                    id="ins-pac-l"
                    value={pacLar}
                    onChange={(e) => setPacLar(e.target.value)}
                    className="bg-background"
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ins-pac-c">Comprimento</Label>
                  <Input
                    id="ins-pac-c"
                    value={pacComp}
                    onChange={(e) => setPacComp(e.target.value)}
                    className="bg-background"
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ins-pac-p">Peso</Label>
                  <Input
                    id="ins-pac-p"
                    value={pacPeso}
                    onChange={(e) => setPacPeso(e.target.value)}
                    className="bg-background"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Foto do insumo (opcional)"
                description="WebP ou JPEG após compressão no navegador · máx. 1 MB · requer R2 configurado na API."
                onPrepared={({ blob, filename, mimeType }) => {
                  setPendingImageBlob(blob);
                  setPendingImageName(filename);
                  setPendingImageMime(mimeType);
                }}
              />
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
          Modo demonstração: insumos de exemplo para <span className="text-foreground">{supplierEmail}</span>.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium"> </th>
              <th className="px-3 py-3 font-medium">Nome</th>
              <th className="px-3 py-3 font-medium">SKU</th>
              <th className="px-3 py-3 font-medium">Tipo / qtd</th>
              <th className="px-3 py-3 font-medium">Pacote (cm)</th>
              <th className="px-3 py-3 font-medium text-right">Custo</th>
              <th className="px-3 py-3 font-medium text-right">Frete*</th>
              <th className="px-3 py-3 font-medium text-right">Total</th>
              {apiMode ? <th className="px-3 py-3 font-medium text-right">Ações</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((row) => (
              <tr key={row.id} className="bg-card hover:bg-muted/20">
                <td className="px-3 py-2 w-14">
                  {row.imagem_url ? (
                    <div className="h-10 w-10 overflow-hidden rounded border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- URLs R2/domínio variável; evita remotePatterns em build */}
                      <img
                        src={row.imagem_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded border border-dashed border-border bg-muted/40" />
                  )}
                </td>
                <td className="px-3 py-3 font-medium text-foreground">
                  {row.nome}
                  {row.observacao ? (
                    <div className="mt-0.5 text-xs font-normal text-muted-foreground">{row.observacao}</div>
                  ) : null}
                </td>
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{row.sku_interno}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {row.quantidade_kind === "PECA" ? "Peça" : "Metro"} · {row.quantidade ?? 1}
                </td>
                <td className="px-3 py-3 text-xs tabular-nums text-muted-foreground">
                  {row.pacote_altura_cm ?? "—"}×{row.pacote_largura_cm ?? "—"}×{row.pacote_comprimento_cm ?? "—"}{" "}
                  · {row.pacote_peso_kg ?? "—"} kg
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {row.custo_fornecedor != null ? formatBrl(row.custo_fornecedor) : "—"}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                  {row.frete_ate_executor != null ? formatBrl(row.frete_ate_executor) : "—"}
                </td>
                <td className="px-3 py-3 text-right font-medium tabular-nums text-foreground">
                  {row.custo_fornecedor == null && row.frete_ate_executor == null
                    ? "—"
                    : formatBrl(insumoCostTotal(row))}
                </td>
                {apiMode ? (
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="border-destructive/80"
                        disabled={pending || deletingId !== null}
                        onClick={() => void onDelete(row.id)}
                      >
                        {deletingId === row.id ? "A apagar…" : "Apagar"}
                      </Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        * Frete na tabela é valor legado ou estimativa; o fluxo alvo usa <strong>Melhor Envio</strong> após
        atribuição ao executor (aba Entregas).
      </p>
    </div>
  );
}
