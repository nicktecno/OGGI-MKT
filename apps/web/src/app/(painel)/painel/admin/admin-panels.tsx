"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/upload/image-upload-field";
import { IMAGE_UPLOAD_LIMITS } from "@/lib/image-upload-limits";
import {
  compositeInsumosTotal,
  mergeSupplyCatalog,
  resolveCompositeLines,
  type DemoCompositeProduct,
  type DemoSupplyItem,
  type DemoExecutionRequest,
  type DemoProductionAssignment,
  type ExecutorPickerOption,
} from "@/lib/demo-seed";
import { ADMIN_CARD, ADMIN_CARD_HEADER } from "@/components/admin/admin-panel-styles";
import { cn, formatBrl } from "@/lib/utils";
import {
  approveExecutionRequest,
  archiveProductionAssignment,
  createCompositeProductAction,
  createDirectAssignment,
  rejectExecutionRequest,
  setProductActive,
  setProductAdminPaused,
  updateCompositeProductPricing,
  uploadMarketplaceProductImage,
} from "./actions";

function labelPedidoCostureira(status: string): string {
  switch (status) {
    case "PENDING":
      return "Aguardando sua resposta";
    case "APPROVED":
      return "Aceito";
    case "REJECTED":
      return "Recusado";
    case "WITHDRAWN":
      return "Cancelado pela costureira";
    default:
      return status;
  }
}

function labelTrabalho(status: string): string {
  switch (status) {
    case "ASSIGNED":
      return "Combinado, ainda não começou";
    case "IN_PRODUCTION":
      return "Em produção";
    case "PRODUCTION_DONE":
      return "Pronto, falta liberar na loja";
    case "PUBLISHED":
      return "À venda na loja";
    case "ARCHIVED":
      return "Encerrado";
    default:
      return status;
  }
}

function labelComoEntrou(origem: string): string {
  if (origem === "ADMIN_DIRECT") return "Você indicou";
  if (origem === "REQUEST_APPROVED") return "Pedido da costureira aceito";
  return origem;
}

function pacoteDefaults(p: DemoCompositeProduct) {
  return {
    pacote_altura_cm: p.pacote_altura_cm ?? 22,
    pacote_largura_cm: p.pacote_largura_cm ?? 18,
    pacote_comprimento_cm: p.pacote_comprimento_cm ?? 8,
    pacote_peso_kg: p.pacote_peso_kg ?? 0.55,
  };
}

function AdminNovaPecaCard({
  supplies,
  pending,
  run,
}: {
  supplies: DemoSupplyItem[];
  pending: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [desc, setDesc] = useState("");
  const [lines, setLines] = useState<Array<{ supplyItemId: string; quantidade: string }>>(() =>
    supplies[0] ? [{ supplyItemId: supplies[0].id, quantidade: "1" }] : [{ supplyItemId: "", quantidade: "1" }],
  );

  useEffect(() => {
    if (supplies.length === 0) return;
    setLines((prev) => {
      if (prev.length !== 1) return prev;
      if (prev[0].supplyItemId) return prev;
      return [{ supplyItemId: supplies[0].id, quantidade: prev[0].quantidade || "1" }];
    });
  }, [supplies]);

  if (supplies.length === 0) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/[0.08] ring-1 ring-amber-500/15">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Nova modelo (produto composto)</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Ainda não há insumos no catálogo. Aprove cadastros de fornecedores em{" "}
            <strong className="text-foreground">Cadastros</strong> para poder montar uma peça aqui.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={ADMIN_CARD}>
      <CardHeader className={ADMIN_CARD_HEADER}>
        <CardTitle className="font-serif text-xl">Nova modelo (produto composto)</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Crie o desenho do produto: insumos e quantidades. Depois defina preço, pacote e foto nos cartões
          abaixo; para vincular costureiras use <strong className="text-foreground">Quem faz o quê</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const linhasParsed = lines
              .filter((l) => l.supplyItemId.trim())
              .map((l) => ({
                supply_item_id: l.supplyItemId.trim(),
                quantidade: Number(l.quantidade.replace(",", ".")),
              }));
            if (!nome.trim() || !sku.trim() || !desc.trim() || linhasParsed.length === 0) return;
            if (linhasParsed.some((l) => !Number.isFinite(l.quantidade) || l.quantidade <= 0)) return;
            run(async () => {
              await createCompositeProductAction({
                nome: nome.trim(),
                slug: slug.trim() || undefined,
                sku: sku.trim(),
                descricao_curta: desc.trim(),
                linhas: linhasParsed,
              });
              setNome("");
              setSlug("");
              setSku("");
              setDesc("");
              setLines([{ supplyItemId: supplies[0].id, quantidade: "1" }]);
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nova-nome">Nome da peça</Label>
              <Input id="nova-nome" value={nome} onChange={(e) => setNome(e.target.value)} disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova-sku">SKU</Label>
              <Input id="nova-sku" value={sku} onChange={(e) => setSku(e.target.value)} disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova-slug">Slug na URL (opcional)</Label>
              <Input
                id="nova-slug"
                placeholder="gerado a partir do nome se vazio"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nova-desc">Descrição curta (vitrine)</Label>
              <textarea
                id="nova-desc"
                className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                disabled={pending}
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Insumos e quantidades</Label>
            {lines.map((line, idx) => (
              <div key={idx} className="flex flex-wrap items-end gap-2">
                <select
                  className="h-10 min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                  value={line.supplyItemId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, supplyItemId: v } : x)));
                  }}
                  disabled={pending}
                >
                  <option value="">Escolha o insumo…</option>
                  {supplies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({s.sku_interno})
                    </option>
                  ))}
                </select>
                <Input
                  className="w-28"
                  inputMode="decimal"
                  value={line.quantidade}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, quantidade: v } : x)));
                  }}
                  disabled={pending}
                />
                {lines.length > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                setLines((prev) => [...prev, { supplyItemId: supplies[0]?.id ?? "", quantidade: "1" }])
              }
            >
              Adicionar insumo
            </Button>
          </div>
          <Button type="submit" disabled={pending}>
            Criar modelo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SectionIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/85 via-card/45 to-muted/25 px-5 py-6 shadow-sm ring-1 ring-foreground/[0.03] sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-8 top-0 h-28 w-40 rounded-full bg-accent/[0.08] blur-2xl" />
      <div className="relative max-w-2xl space-y-2">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <div className="text-base leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </header>
  );
}

export function AdminPecasPanel({
  products,
  supplyCatalogExtra,
  pending,
  run,
}: {
  products: DemoCompositeProduct[];
  /** Insumos vindos da API para resolver linhas além do seed. */
  supplyCatalogExtra?: DemoSupplyItem[];
  pending: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const supplyCatalog = mergeSupplyCatalog(supplyCatalogExtra ?? []);

  return (
    <div className="space-y-8">
      <SectionIntro title="Peças e preços">
        <p>
          Aqui você ajusta o preço que o cliente vê, o que fica para a costureira e para a loja, e
          pode pausar uma peça inteira na vitrine ou tirá-la de uso.{" "}
          <strong className="text-foreground">Pausar na vitrine</strong> esconde todas as ofertas
          daquele modelo; <strong className="text-foreground">Desativar</strong> tira a peça das
          buscas.
        </p>
      </SectionIntro>

      <AdminNovaPecaCard supplies={supplyCatalog} pending={pending} run={run} />

      <div className="grid gap-8 xl:grid-cols-2">
        {products.map((product) => {
          const lines = resolveCompositeLines(product, supplyCatalog);
          const insumoTotal = compositeInsumosTotal(product);
          return (
            <Card key={product.id} className={cn(ADMIN_CARD, "shadow-none hover:shadow-lg")}>
              <CardHeader className={cn("space-y-3 pb-5", ADMIN_CARD_HEADER)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="font-serif text-xl leading-snug sm:text-2xl">
                      {product.nome}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Código da peça: {product.sku}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <StatusChip ok={product.ativo} label={product.ativo ? "Ativa" : "Inativa"} />
                    <StatusChip
                      ok={!product.admin_pausado}
                      label={product.admin_pausado ? "Pausada na vitrine" : "Aparece na loja"}
                      muted={product.admin_pausado}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={product.admin_pausado ? "default" : "outline"}
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => setProductAdminPaused(product.id, !product.admin_pausado))
                    }
                  >
                    {product.admin_pausado ? "Voltar a mostrar na vitrine" : "Pausar na vitrine"}
                  </Button>
                  <Button
                    type="button"
                    variant={product.ativo ? "outline" : "default"}
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => setProductActive(product.id, !product.ativo))}
                  >
                    {product.ativo ? "Desativar peça" : "Ativar peça"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/5 p-4 sm:flex-row sm:items-start">
                  <div className="space-y-2 shrink-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Foto na loja
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (Unsplash ou R2) */}
                    <img
                      src={product.imagem_url}
                      alt=""
                      className="h-40 w-full max-w-[200px] rounded-md border border-border object-cover sm:h-36 sm:w-36"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <ImageUploadField
                      label="Substituir imagem da vitrine"
                      description={`JPEG, PNG ou WebP · comprimimos no navegador para WebP até ${Math.round(IMAGE_UPLOAD_LIMITS.maxOutputFileBytes / (1024 * 1024))} MB e enviamos para o armazenamento Cloudflare R2 (se estiver configurado na API).`}
                      onPrepared={(prep) => {
                        run(async () => {
                          const f = new File([prep.blob], prep.filename, { type: "image/webp" });
                          const fd = new FormData();
                          fd.append("file", f);
                          await uploadMarketplaceProductImage(product.id, fd);
                        });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Materiais usados neste modelo
                  </h3>
                  <ul className="mt-3 divide-y divide-border rounded-lg border border-border/80">
                    {lines.map((row) => (
                      <li
                        key={row.supplyItemId}
                        className="flex flex-col gap-1 px-4 py-3 text-base sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{row.insumo.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {row.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
                            {row.insumo.unidade} · {formatBrl(row.snapshot_custo_unitario)} por{" "}
                            {row.insumo.unidade}
                          </p>
                        </div>
                        <p className="shrink-0 text-base tabular-nums text-foreground">
                          {formatBrl(row.quantidade * row.snapshot_custo_unitario)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-right text-sm text-muted-foreground">
                    Soma dos materiais:{" "}
                    <span className="font-medium text-foreground">{formatBrl(insumoTotal)}</span>
                  </p>
                </div>

                <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Valores de venda
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Estes números aparecem para o cliente e ajudam a calcular repasses.
                  </p>
                  <div className="mt-4">
                    <PricingForm product={product} disabled={pending} run={run} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatusChip({
  ok,
  label,
  muted,
}: {
  ok: boolean;
  label: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide shadow-sm",
        ok && !muted
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          : "border-border bg-muted/60 text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export function AdminPedidosPanel({
  products,
  executionRequests,
  pending,
  run,
}: {
  products: DemoCompositeProduct[];
  executionRequests: DemoExecutionRequest[];
  pending: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const pendingRequests = executionRequests.filter((r) => r.status === "PENDING");
  const processed = executionRequests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-10">
      <SectionIntro title="Pedidos das costureiras">
        <p>
          Quando alguém quer produzir um modelo que ainda não está com ela, o pedido aparece aqui.{" "}
          <strong className="text-foreground">Aceitar</strong> combina a costureira com a peça.{" "}
          <strong className="text-foreground">Recusar</strong> fecha o pedido; você pode deixar uma
          nota para o time.
        </p>
      </SectionIntro>

      <div>
        <h3 className="mb-3 font-serif text-lg font-medium text-foreground">Aguardando você</h3>
        <Card className={ADMIN_CARD}>
          <CardContent className="pt-6">
            {pendingRequests.length === 0 ? (
              <p className="text-base leading-relaxed text-muted-foreground">
                Ninguém está esperando resposta no momento.
              </p>
            ) : (
              <ul className="space-y-4">
                {pendingRequests.map((r) => {
                  const p = products.find((x) => x.id === r.compositeProductId);
                  return (
                    <li
                      key={r.id}
                      className="rounded-xl border border-border/50 bg-muted/10 p-4 shadow-sm ring-1 ring-foreground/[0.02] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <p className="font-serif text-xl font-medium text-foreground">
                            {p?.nome ?? "Peça"}
                          </p>
                          <dl className="grid gap-1 text-base text-muted-foreground sm:grid-cols-[auto_1fr] sm:gap-x-4">
                            <dt className="font-medium text-foreground/90">Costureira</dt>
                            <dd>
                              {r.executorNome}
                              <span className="mt-0.5 block text-sm">{r.executorEmail}</span>
                            </dd>
                          </dl>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                          <Button
                            type="button"
                            size="sm"
                            disabled={pending}
                            onClick={() => run(() => approveExecutionRequest(r.id))}
                          >
                            Aceitar pedido
                          </Button>
                          <RejectInline requestId={r.id} disabled={pending} run={run} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {processed.length > 0 ? (
        <div>
          <h3 className="mb-3 font-serif text-lg font-medium text-foreground">Respostas anteriores</h3>
          <div className="overflow-hidden overflow-x-auto rounded-xl border border-border/50 shadow-sm ring-1 ring-foreground/[0.03]">
            <table className="w-full min-w-[520px] text-left text-base">
              <thead className="border-b border-border/60 bg-gradient-to-r from-muted/60 to-muted/25 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Peça</th>
                  <th className="px-4 py-3 font-medium">Costureira</th>
                  <th className="px-4 py-3 font-medium">Situação</th>
                  <th className="px-4 py-3 font-medium">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {processed.map((r) => {
                  const p = products.find((x) => x.id === r.compositeProductId);
                  return (
                    <tr key={r.id} className="bg-card/40 transition-colors hover:bg-muted/15">
                      <td className="px-4 py-3 align-top font-medium text-foreground">
                        {p?.nome ?? "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{r.executorNome}</td>
                      <td className="px-4 py-3 align-top text-foreground">
                        {labelPedidoCostureira(r.status)}
                      </td>
                      <td className="max-w-xs px-4 py-3 align-top text-sm text-muted-foreground">
                        {r.status === "REJECTED" && r.rejection_reason
                          ? r.rejection_reason
                          : r.reviewed_at
                            ? `Respondido em ${new Date(r.reviewed_at).toLocaleString("pt-BR")}`
                            : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminCombinacoesPanel({
  products,
  productionAssignments,
  executorOptions,
  pending,
  run,
}: {
  products: DemoCompositeProduct[];
  productionAssignments: DemoProductionAssignment[];
  executorOptions: ExecutorPickerOption[];
  pending: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const visibleAssignments = productionAssignments.filter((a) => a.status !== "ARCHIVED");

  return (
    <div className="space-y-10">
      <SectionIntro title="Quem faz o quê">
        <p>
          Cada linha é uma costureira responsável por um modelo. Quando algo deve sair da loja ou
          do fluxo, use <strong className="text-foreground">Encerrar</strong> — a combinação deixa de
          aparecer como ativa.
        </p>
      </SectionIntro>

      <div>
        <h3 className="mb-3 font-serif text-lg font-medium text-foreground">Em andamento</h3>
        <Card className={cn(ADMIN_CARD, "overflow-hidden")}>
          <CardContent className="p-0 sm:p-0">
            {visibleAssignments.length === 0 ? (
              <p className="p-6 text-base text-muted-foreground">Nada ativo por aqui.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-base">
                  <thead className="border-b border-border/60 bg-gradient-to-r from-muted/60 to-muted/25 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">Peça</th>
                      <th className="px-4 py-3.5 font-semibold">Costureira</th>
                      <th className="px-4 py-3.5 font-semibold">Situação</th>
                      <th className="px-4 py-3.5 font-semibold">Como entrou</th>
                      <th className="px-4 py-3.5 text-right font-semibold">À venda (un.)</th>
                      <th className="px-4 py-3.5 text-right font-semibold"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleAssignments.map((a) => {
                      const p = products.find((x) => x.id === a.compositeProductId);
                      return (
                        <tr key={a.id} className="bg-card/50 transition-colors hover:bg-muted/15">
                          <td className="px-4 py-3.5 align-middle font-medium text-foreground">
                            {p?.nome ?? "—"}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-muted-foreground">
                            {a.executorNome}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-foreground">
                            {labelTrabalho(a.status)}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-sm text-muted-foreground">
                            {labelComoEntrou(a.assignment_source)}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right text-base tabular-nums text-foreground">
                            {a.available_quantity}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={pending}
                              onClick={() => run(() => archiveProductionAssignment(a.id))}
                            >
                              Encerrar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 text-base font-medium text-foreground">Indicar costureira você mesmo</h3>
        <DirectAssignForm
          products={products}
          executorOptions={executorOptions}
          disabled={pending}
          run={run}
        />
      </div>
    </div>
  );
}

function PricingForm({
  product,
  disabled,
  run,
}: {
  product: DemoCompositeProduct;
  disabled: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const [preco, setPreco] = useState(String(product.preco_venda_publico));
  const [execFee, setExecFee] = useState(String(product.executor_fee_planejada));
  const [platFee, setPlatFee] = useState(String(product.platform_fee_planejada));
  const pd0 = pacoteDefaults(product);
  const [pacAlt, setPacAlt] = useState(String(pd0.pacote_altura_cm));
  const [pacLar, setPacLar] = useState(String(pd0.pacote_largura_cm));
  const [pacComp, setPacComp] = useState(String(pd0.pacote_comprimento_cm));
  const [pacPeso, setPacPeso] = useState(String(pd0.pacote_peso_kg));

  useEffect(() => {
    setPreco(String(product.preco_venda_publico));
    setExecFee(String(product.executor_fee_planejada));
    setPlatFee(String(product.platform_fee_planejada));
    const pd = pacoteDefaults(product);
    setPacAlt(String(pd.pacote_altura_cm));
    setPacLar(String(pd.pacote_largura_cm));
    setPacComp(String(pd.pacote_comprimento_cm));
    setPacPeso(String(pd.pacote_peso_kg));
  }, [product]);

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() =>
          updateCompositeProductPricing({
            productId: product.id,
            preco_venda_publico: Number(preco.replace(",", ".")),
            executor_fee_planejada: Number(execFee.replace(",", ".")),
            platform_fee_planejada: Number(platFee.replace(",", ".")),
            pacote_altura_cm: Number(pacAlt.replace(",", ".")),
            pacote_largura_cm: Number(pacLar.replace(",", ".")),
            pacote_comprimento_cm: Number(pacComp.replace(",", ".")),
            pacote_peso_kg: Number(pacPeso.replace(",", ".")),
          }),
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`preco-${product.id}`} className="font-medium leading-snug">
            Preço na loja (R$)
          </Label>
          <Input
            id={`preco-${product.id}`}
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`exec-${product.id}`} className="font-medium leading-snug">
            Valor previsto para a costureira (R$)
          </Label>
          <Input
            id={`exec-${product.id}`}
            value={execFee}
            onChange={(e) => setExecFee(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`plat-${product.id}`} className="font-medium leading-snug">
            Margem da loja (R$)
          </Label>
          <Input
            id={`plat-${product.id}`}
            value={platFee}
            onChange={(e) => setPlatFee(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/35 to-muted/10 p-4 shadow-sm ring-1 ring-foreground/[0.02]">
        <h4 className="text-sm font-semibold text-foreground">Pacote da peça pronta (envio ao cliente)</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Dimensões e peso usados na cotação Melhor Envio quando a costureira posta o produto acabado. Ajuste
          conforme a embalagem real do modelo.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label className="min-h-8 text-xs font-medium leading-tight flex items-end" htmlFor={`pac-a-${product.id}`}>
              Altura (cm)
            </Label>
            <Input
              id={`pac-a-${product.id}`}
              value={pacAlt}
              onChange={(e) => setPacAlt(e.target.value)}
              disabled={disabled}
              inputMode="decimal"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="min-h-8 text-xs font-medium leading-tight flex items-end" htmlFor={`pac-l-${product.id}`}>
              Largura (cm)
            </Label>
            <Input
              id={`pac-l-${product.id}`}
              value={pacLar}
              onChange={(e) => setPacLar(e.target.value)}
              disabled={disabled}
              inputMode="decimal"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="min-h-8 text-xs font-medium leading-tight flex items-end" htmlFor={`pac-c-${product.id}`}>
              Comprimento (cm)
            </Label>
            <Input
              id={`pac-c-${product.id}`}
              value={pacComp}
              onChange={(e) => setPacComp(e.target.value)}
              disabled={disabled}
              inputMode="decimal"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="min-h-8 text-xs font-medium leading-tight flex items-end" htmlFor={`pac-p-${product.id}`}>
              Peso (kg)
            </Label>
            <Input
              id={`pac-p-${product.id}`}
              value={pacPeso}
              onChange={(e) => setPacPeso(e.target.value)}
              disabled={disabled}
              inputMode="decimal"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="sm" disabled={disabled}>
          Guardar valores
        </Button>
        <p className="text-sm text-muted-foreground">
          Soma dos materiais (referência):{" "}
          <span className="font-medium tabular-nums text-foreground">
            {formatBrl(compositeInsumosTotal(product))}
          </span>
        </p>
      </div>
    </form>
  );
}

function RejectInline({
  requestId,
  disabled,
  run,
}: {
  requestId: string;
  disabled: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        Recusar…
      </Button>
    );
  }
  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => rejectExecutionRequest(requestId, reason));
        setOpen(false);
        setReason("");
      }}
    >
      <div className="min-w-[12rem] flex-1 space-y-1">
        <Label htmlFor={`reject-${requestId}`}>
          Motivo (opcional)
        </Label>
        <Input
          id={`reject-${requestId}`}
          placeholder="Ex.: falta de capacidade neste mês"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={disabled}>
          Confirmar recusa
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Voltar
        </Button>
      </div>
    </form>
  );
}

function DirectAssignForm({
  products,
  executorOptions,
  disabled,
  run,
}: {
  products: DemoCompositeProduct[];
  executorOptions: ExecutorPickerOption[];
  disabled: boolean;
  run: (fn: () => Promise<void>) => void;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [executorEmail, setExecutorEmail] = useState(() => executorOptions[0]?.email ?? "");
  const [cidade, setCidade] = useState("São Paulo — SP");
  const [cep, setCep] = useState("01310-100");

  useEffect(() => {
    if (executorOptions.length === 0) return;
    const still = executorOptions.some((o) => o.email === executorEmail);
    if (!still) setExecutorEmail(executorOptions[0].email);
  }, [executorOptions, executorEmail]);

  const selectedExecutor = executorOptions.find((o) => o.email === executorEmail);

  if (executorOptions.length === 0) {
    return (
      <Card className={cn(ADMIN_CARD, "max-w-2xl")}>
        <CardHeader className={ADMIN_CARD_HEADER}>
          <CardTitle className="font-serif text-xl">Nova combinação peça + costureira</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Para vincular uma costureira, é preciso ter pelo menos uma conta de costureira ativa
            (cadastro aprovado). Depois ela aparece aqui na lista — não use texto livre para evitar
            erros de vínculo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn(ADMIN_CARD, "max-w-2xl")}>
      <CardHeader className={ADMIN_CARD_HEADER}>
        <CardTitle className="font-serif text-xl">Nova combinação peça + costureira</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Escolha a costureira na lista (nome e e-mail vêm do cadastro). Use quando você quer definir
          diretamente quem faz um modelo, sem passar pelo pedido dela. Não repita a mesma costureira
          para o mesmo produto se já houver uma combinação ativa.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedExecutor) return;
            run(() =>
              createDirectAssignment({
                compositeProductId: productId,
                executorEmail: selectedExecutor.email,
                executorNome: selectedExecutor.displayName,
                cidade_origem: cidade,
                cep_origem: cep,
              }),
            );
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="da-product">Peça</Label>
            <select
              id="da-product"
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-[1.0625rem] outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={disabled}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="da-executor">Costureira (cadastro)</Label>
            <select
              id="da-executor"
              className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-[1.0625rem] outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
              value={executorEmail}
              onChange={(e) => setExecutorEmail(e.target.value)}
              disabled={disabled}
            >
              {executorOptions.map((o) => (
                <option key={o.email} value={o.email}>
                  {o.displayName} — {o.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="da-cidade">Cidade de onde posta</Label>
            <Input id="da-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} disabled={disabled} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="da-cep">CEP de postagem</Label>
            <Input id="da-cep" value={cep} onChange={(e) => setCep(e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={disabled || !selectedExecutor}>
              Guardar combinação
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
