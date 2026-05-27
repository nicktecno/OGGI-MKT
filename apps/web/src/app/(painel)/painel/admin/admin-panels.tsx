"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/upload/image-upload-field";
import { IMAGE_UPLOAD_LIMITS } from "@/lib/image-upload-limits";
import { formatVariacoesTamanhosLabel, ROUPA_TAMANHOS } from "@/lib/product-sizes";
import {
  compositeInsumosTotal,
  compositePrecoFromLinhasAndFees,
  compositePrecoPreviaSemFreteB2B,
  compositeProductHasActiveAssignment,
  demoFreteB2BBreakdownForCompositeProduct,
  insumoCostTotal,
  mergeSupplyCatalog,
  supplierOptionsFromCatalog,
  type DemoCompositeProduct,
  type DemoSupplyItem,
  type SupplierPickerOption,
  type DemoExecutionRequest,
  type DemoProductionAssignment,
  type ExecutorPickerOption,
} from "@/lib/demo-seed";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_CARD, ADMIN_CARD_HEADER } from "@/components/admin/admin-panel-styles";
import { SupplyItemDetailModal } from "@/components/admin/supply-item-detail-modal";
import { cn, formatBrl } from "@/lib/utils";
import {
  approveExecutionRequest,
  archiveProductionAssignment,
  createCompositeProductAction,
  createDirectAssignment,
  deleteCompositeProductAction,
  rejectExecutionRequest,
  removeMarketplaceProductGalleryImageAction,
  setAssignmentStorefrontHighlightOrderAction,
  setProductActive,
  setProductAdminPaused,
  updateCompositeProductPricing,
  uploadMarketplaceProductGalleryImage,
  uploadMarketplaceProductImage,
} from "./actions";
import { adminActionLoading, type AdminMutationRun } from "./use-admin-mutations";

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

function sortTamanhosSelecionados(selected: string[]): string[] {
  return ROUPA_TAMANHOS.filter((t) => selected.includes(t));
}

function labelComoEntrou(origem: string): string {
  if (origem === "ADMIN_DIRECT") return "Você indicou";
  if (origem === "REQUEST_APPROVED") return "Pedido da costureira aceito";
  return origem;
}

function StorefrontHighlightOrderCell({
  assignmentId,
  initialOrder,
  pending,
  pendingScope,
  run,
}: {
  assignmentId: string;
  initialOrder?: number | null;
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
}) {
  const scope = `highlight-${assignmentId}`;
  const saving = adminActionLoading(pending, pendingScope, scope);
  const [val, setVal] = useState(() =>
    initialOrder === undefined || initialOrder === null ? "" : String(initialOrder),
  );

  useEffect(() => {
    setVal(initialOrder === undefined || initialOrder === null ? "" : String(initialOrder));
  }, [initialOrder, assignmentId]);

  return (
    <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:justify-end">
      <Input
        className="h-9 w-14 text-right tabular-nums"
        inputMode="numeric"
        placeholder="—"
        value={val}
        disabled={pending}
        onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 2))}
        aria-label="Ordem no destaque da loja (0 = primeiro; vazio = não destacar)"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0"
        disabled={pending}
        onClick={() =>
          run(async () => {
            const t = val.trim();
            const order = t === "" ? null : Number.parseInt(t, 10);
            if (order !== null && (!Number.isInteger(order) || order < 0)) {
              throw new Error("Use um número inteiro ≥ 0 ou deixe vazio.");
            }
            await setAssignmentStorefrontHighlightOrderAction(assignmentId, order);
          }, scope)
        }
      >
        {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
        OK
      </Button>
    </div>
  );
}

function MarketplaceImagesDisabledCallout() {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] px-4 py-3 text-sm leading-relaxed text-amber-950 shadow-sm ring-1 ring-amber-500/15 dark:text-amber-50">
      <p className="font-medium text-foreground">Fotos da vitrine só com API e R2</p>
      <p className="mt-1.5 text-muted-foreground">
        No Next, defina{" "}
        <span className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-xs text-foreground">
          COMMERCE_API_URL
        </span>{" "}
        (ou{" "}
        <span className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-xs text-foreground">
          SERVER_API_URL
        </span>
        ) e{" "}
        <span className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-xs text-foreground">
          INTERNAL_API_SECRET
        </span>
        . Na API Nest, configure{" "}
        <span className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-xs text-foreground">
          R2_*
        </span>{" "}
        e URL pública do bucket. Sem isso o envio de imagens não é guardado.
      </p>
    </div>
  );
}

function pacoteDefaults(p: DemoCompositeProduct) {
  return {
    pacote_altura_cm: p.pacote_altura_cm ?? 22,
    pacote_largura_cm: p.pacote_largura_cm ?? 18,
    pacote_comprimento_cm: p.pacote_comprimento_cm ?? 8,
    pacote_peso_kg: p.pacote_peso_kg ?? 0.55,
  };
}

const MAX_IMAGENS_NOVA_PECA = 5;

type NovaPecaImagePrep = {
  id: string;
  blob: Blob;
  filename: string;
  mimeType: "image/webp" | "image/jpeg";
};

function NovaPecaImagemPrepRow({
  prep,
  index,
  disabled,
  onRemove,
}: {
  prep: NovaPecaImagePrep;
  index: number;
  disabled: boolean;
  onRemove: () => void;
}) {
  const url = useMemo(() => URL.createObjectURL(prep.blob), [prep.blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- pré-visualização local */}
      <img src={url} alt="" className="h-16 w-16 shrink-0 rounded-md border border-border object-cover" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-foreground">
          {index === 0 ? "Capa da vitrine" : `Galeria · foto ${index + 1}`}
        </p>
        <p className="truncate text-xs text-muted-foreground">{prep.filename}</p>
      </div>
      <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={disabled} onClick={onRemove}>
        Remover
      </Button>
    </div>
  );
}

function suppliesForSupplier(supplies: DemoSupplyItem[], supplierEmail: string): DemoSupplyItem[] {
  const norm = supplierEmail.trim().toLowerCase();
  if (!norm) return [];
  return supplies.filter((s) => s.supplierEmail.trim().toLowerCase() === norm);
}

function InsumoThumb({ url, className }: { url?: string | null; className?: string }) {
  const base = "h-9 w-9 shrink-0 rounded-md border border-border bg-muted/40 object-cover";
  if (url?.trim()) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs R2 ou fornecedor */}
        <img src={url.trim()} alt="" className={cn(base, className)} />
      </>
    );
  }
  return (
    <div
      className={cn(base, "flex items-center justify-center text-[10px] font-medium text-muted-foreground", className)}
      title="Sem foto"
    >
      —
    </div>
  );
}

type MenuCoords = { top: number; left: number; width: number; maxH: number };

type NovaPecaInsumoLine = { supplierEmail: string; supplyItemId: string; quantidade: string };

function initialNovaPecaLine(supplies: DemoSupplyItem[]): NovaPecaInsumoLine {
  const opts = supplierOptionsFromCatalog(supplies);
  const e = opts[0]?.email ?? "";
  const id = supplies.find((s) => s.supplierEmail.trim().toLowerCase() === e.toLowerCase())?.id ?? "";
  return { supplierEmail: e, supplyItemId: id, quantidade: "1" };
}

function FornecedorPicker({
  options,
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  options: SupplierPickerOption[];
  value: string;
  onChange: (email: string) => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [menu, setMenu] = useState<MenuCoords>({ top: 0, left: 0, width: 280, maxH: 280 });

  const updateMenuPosition = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector("button[type='button']");
    if (!(btn instanceof HTMLElement)) return;
    const r = btn.getBoundingClientRect();
    const gap = 6;
    const margin = 10;
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const openDown = spaceBelow >= 120 || spaceBelow >= spaceAbove;
    const rawMax = openDown ? spaceBelow - gap : spaceAbove - gap;
    const maxH = Math.min(320, Math.max(120, rawMax));
    const top = openDown ? r.bottom + gap : r.top - maxH - gap;
    setMenu({
      top,
      left: r.left,
      width: Math.max(r.width, 268),
      maxH,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const listbox =
    open && typeof document !== "undefined" ? (
      <ul
        ref={listRef}
        role="listbox"
        style={{
          position: "fixed",
          top: menu.top,
          left: menu.left,
          width: menu.width,
          maxHeight: menu.maxH,
          zIndex: 200,
        }}
        className="overflow-y-auto overscroll-contain rounded-md border border-border bg-popover py-1 text-sm shadow-lg"
      >
        {options.map((opt) => (
          <li key={opt.email.toLowerCase()} className="px-1">
            <button
              type="button"
              role="option"
              aria-selected={value.trim().toLowerCase() === opt.email.trim().toLowerCase()}
              aria-label={`${opt.label} · ${opt.email}`}
              className={cn(
                "flex w-full min-w-0 rounded-sm px-3 py-2.5 text-left hover:bg-muted/80",
                value.trim().toLowerCase() === opt.email.trim().toLowerCase() && "bg-accent/15",
              )}
              onClick={() => {
                onChange(opt.email);
                setOpen(false);
              }}
            >
              <span className="min-w-0 truncate font-medium text-foreground">{opt.label}</span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  const pickerDisabled = disabled || options.length === 0;
  const selectedOpt = options.find((o) => o.email.trim().toLowerCase() === value.trim().toLowerCase());

  return (
    <div ref={wrapRef} className="relative min-w-[17rem] max-w-[min(100%,32rem)] shrink-0 sm:min-w-[20rem]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          selectedOpt ? `${ariaLabel}: ${selectedOpt.label} (${selectedOpt.email})` : ariaLabel
        }
        disabled={pickerDisabled}
        onClick={() => {
          if (pickerDisabled) return;
          setOpen((o) => !o);
        }}
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-sm",
          "transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          pickerDisabled && "pointer-events-none opacity-60",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedOpt ? (
            <span className="truncate font-medium text-foreground">{selectedOpt.label}</span>
          ) : value.trim() ? (
            <span className="truncate text-foreground">{value}</span>
          ) : (
            <span className="text-muted-foreground">Fornecedor…</span>
          )}
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {listbox ? createPortal(listbox, document.body) : null}
    </div>
  );
}

function InsumoPicker({
  supplies,
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  supplies: DemoSupplyItem[];
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [menu, setMenu] = useState<MenuCoords>({ top: 0, left: 0, width: 300, maxH: 280 });

  const updateMenuPosition = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector("button[type='button']");
    if (!(btn instanceof HTMLElement)) return;
    const r = btn.getBoundingClientRect();
    const gap = 6;
    const margin = 10;
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const openDown = spaceBelow >= 120 || spaceBelow >= spaceAbove;
    const rawMax = openDown ? spaceBelow - gap : spaceAbove - gap;
    const maxH = Math.min(320, Math.max(120, rawMax));
    const top = openDown ? r.bottom + gap : r.top - maxH - gap;
    setMenu({
      top,
      left: r.left,
      width: Math.max(r.width, 288),
      maxH,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selected = value ? supplies.find((s) => s.id === value) : undefined;

  const listbox =
    open && typeof document !== "undefined" ? (
      <ul
        ref={listRef}
        role="listbox"
        style={{
          position: "fixed",
          top: menu.top,
          left: menu.left,
          width: menu.width,
          maxHeight: menu.maxH,
          zIndex: 200,
        }}
        className="overflow-y-auto overscroll-contain rounded-md border border-border bg-popover py-1 text-sm shadow-lg"
      >
        <li className="px-1">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-muted-foreground hover:bg-muted/80"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <span className="pl-1">Limpar seleção</span>
          </button>
        </li>
        {supplies.map((s) => (
          <li key={s.id} className="px-1">
            <button
              type="button"
              role="option"
              aria-selected={value === s.id}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left hover:bg-muted/80",
                value === s.id && "bg-accent/15",
              )}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
            >
              <InsumoThumb url={s.imagem_url} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{s.nome}</span>
                <span className="block truncate text-xs text-muted-foreground">{s.sku_interno}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={wrapRef} className="relative min-w-[260px] flex-1 sm:min-w-[280px]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-sm",
          "transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {selected ? (
          <>
            <InsumoThumb url={selected.imagem_url} />
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">{selected.nome}</span>
            <span className="hidden max-w-[5.5rem] shrink-0 truncate text-xs text-muted-foreground sm:inline">
              {selected.sku_interno}
            </span>
          </>
        ) : (
          <span className="flex-1 text-muted-foreground">Escolha o insumo…</span>
        )}
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {listbox ? createPortal(listbox, document.body) : null}
    </div>
  );
}

export function AdminNovaPecaCard({
  supplies,
  pending,
  pendingScope,
  run,
  marketplaceImagesEnabled,
}: {
  supplies: DemoSupplyItem[];
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
  marketplaceImagesEnabled: boolean;
}) {
  const novaScope = "nova-peca";
  const novaSaving = adminActionLoading(pending, pendingScope, novaScope);
  const supplierOptions = useMemo(() => supplierOptionsFromCatalog(supplies), [supplies]);
  const [nome, setNome] = useState("");
  const [desc, setDesc] = useState("");
  const [imagensPrep, setImagensPrep] = useState<NovaPecaImagePrep[]>([]);
  const [novaImagemFieldKey, setNovaImagemFieldKey] = useState(0);
  const [lines, setLines] = useState<NovaPecaInsumoLine[]>(() => [initialNovaPecaLine(supplies)]);
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<string[]>(() => ["P", "M", "G"]);
  const [tamanhosError, setTamanhosError] = useState<string | null>(null);
  const [novaPecaFormError, setNovaPecaFormError] = useState<string | null>(null);
  const [insumoDetail, setInsumoDetail] = useState<{
    item: DemoSupplyItem;
    qtd?: number;
  } | null>(null);

  useEffect(() => {
    if (supplies.length === 0) return;
    setLines((prev) => {
      if (prev.length !== 1) return prev;
      if (prev[0].supplyItemId) return prev;
      const init = initialNovaPecaLine(supplies);
      return [{ ...init, quantidade: prev[0].quantidade || "1" }];
    });
  }, [supplies]);

  if (supplies.length === 0) {
    return (
      <>
      <Card className="border-amber-500/40 bg-amber-500/[0.08] ring-1 ring-amber-500/15">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Nova modelo (produto composto)</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Ainda não há insumos no catálogo. Peça ao fornecedor cadastrar no painel dele (e aprove em{" "}
            <strong className="text-foreground">Cadastros</strong> se necessário).
          </CardDescription>
        </CardHeader>
      </Card>
      </>
    );
  }

  return (
    <>
    <Card className={ADMIN_CARD}>
      <CardHeader className={ADMIN_CARD_HEADER}>
        <CardTitle className="font-serif text-xl">Cadastro da peça (sem preços)</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Monte o modelo com <strong className="text-foreground">insumos dos fornecedores</strong>, quantidades,
          descrição, tamanhos e fotos. O <strong className="text-foreground">SKU</strong> e o{" "}
          <strong className="text-foreground">slug da URL</strong> são gerados automaticamente a partir do nome ao
          salvar. <strong className="text-foreground">Não inclui valores</strong> — custos
          dos insumos, taxas e pacote ao cliente ficam na aba <strong className="text-foreground">Preços</strong>. O
          frete B2B entra no total só após atribuir costureira ou aprovar pedido.
          {marketplaceImagesEnabled
            ? " Até 5 fotos (a primeira é a capa)."
            : " Fotos após API e R2."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setNovaPecaFormError(null);
            const linhasParsed = lines.map((l) => ({
              supply_item_id: l.supplyItemId.trim(),
              quantidade: Number(l.quantidade.replace(",", ".")),
            }));
            if (!nome.trim()) {
              setNovaPecaFormError("Indique o nome da peça.");
              return;
            }
            if (!desc.trim()) {
              setNovaPecaFormError("A descrição curta é obrigatória — é o texto que aparece na vitrine e na ficha.");
              return;
            }
            if (linhasParsed.length === 0) {
              setNovaPecaFormError("Inclua pelo menos uma linha de insumo com quantidade.");
              return;
            }
            const linhaSemInsumo = lines.findIndex((l) => !l.supplyItemId.trim());
            if (linhaSemInsumo !== -1) {
              setNovaPecaFormError(
                `Linha ${linhaSemInsumo + 1}: escolha o insumo desse fornecedor (cada linha precisa de um item).`,
              );
              return;
            }
            if (linhasParsed.some((l) => !l.supply_item_id)) {
              setNovaPecaFormError("Cada linha precisa de um insumo selecionado.");
              return;
            }
            if (linhasParsed.some((l) => !Number.isFinite(l.quantidade) || l.quantidade <= 0)) {
              setNovaPecaFormError("Confira as quantidades por insumo: use números maiores que zero.");
              return;
            }
            const variacoes_tamanho = sortTamanhosSelecionados(tamanhosSelecionados);
            if (variacoes_tamanho.length === 0) {
              setTamanhosError("Marque pelo menos um tamanho (P, M, G, GG, XG ou Único).");
              return;
            }
            setTamanhosError(null);
            const imagens = imagensPrep;
            run(async () => {
              const capa =
                marketplaceImagesEnabled && imagens.length > 0
                  ? new File([imagens[0].blob], imagens[0].filename, { type: imagens[0].mimeType })
                  : undefined;
              const result = await createCompositeProductAction(
                {
                  nome: nome.trim(),
                  descricao_curta: desc.trim(),
                  linhas: linhasParsed,
                  variacoes_tamanho,
                },
                capa,
              );
              toast.success("Modelo criado", {
                description: `Slug: ${result.slug} · SKU: ${result.sku}`,
              });
              if (marketplaceImagesEnabled && imagens.length > 1) {
                for (let i = 1; i < imagens.length; i++) {
                  const prep = imagens[i];
                  const f = new File([prep.blob], prep.filename, { type: prep.mimeType });
                  const fd = new FormData();
                  fd.append("file", f);
                  try {
                    await uploadMarketplaceProductGalleryImage(result.id, result.slug, fd);
                  } catch (e) {
                    toast.error(
                      e instanceof Error ? e.message : "Não foi possível enviar uma foto da galeria.",
                      { description: `Foto ${i + 1} de ${imagens.length} · confira R2 / Cloudflare na API` },
                    );
                  }
                }
              }
              setNome("");
              setDesc("");
              setImagensPrep([]);
              setNovaImagemFieldKey((k) => k + 1);
              setLines([initialNovaPecaLine(supplies)]);
              setTamanhosSelecionados(["P", "M", "G"]);
              setNovaPecaFormError(null);
            }, novaScope);
          }}
        >
          {novaPecaFormError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {novaPecaFormError}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nova-nome">Nome da peça</Label>
              <Input
                id="nova-nome"
                value={nome}
                onChange={(e) => {
                  setNovaPecaFormError(null);
                  setNome(e.target.value);
                }}
                disabled={pending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nova-desc">Descrição curta (vitrine)</Label>
              <textarea
                id="nova-desc"
                className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={desc}
                onChange={(e) => {
                  setNovaPecaFormError(null);
                  setDesc(e.target.value);
                }}
                disabled={pending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-medium leading-snug">Tamanhos disponíveis</p>
              <p className="text-xs text-muted-foreground">
                Indique em que variações esta peça pode ser oferecida — letras (P a XG) ou tamanho único (vitrine e
                ficha do produto).
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {ROUPA_TAMANHOS.map((t) => (
                  <label
                    key={t}
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border border-input accent-primary"
                      checked={tamanhosSelecionados.includes(t)}
                      onChange={() => {
                        setTamanhosError(null);
                        setNovaPecaFormError(null);
                        setTamanhosSelecionados((prev) => {
                          if (prev.includes(t)) return prev.filter((x) => x !== t);
                          return sortTamanhosSelecionados([...prev, t]);
                        });
                      }}
                      disabled={pending}
                    />
                    {t}
                  </label>
                ))}
              </div>
              {tamanhosError ? (
                <p className="text-sm text-destructive" role="alert">
                  {tamanhosError}
                </p>
              ) : null}
            </div>
          </div>
          {marketplaceImagesEnabled ? (
            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/5 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Fotos da nova peça (opcional)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Até {MAX_IMAGENS_NOVA_PECA} imagens · a <strong className="text-foreground">primeira</strong> é a
                  capa da vitrine; as seguintes aparecem na galeria da ficha do produto. Envio após criar a peça · até{" "}
                  {Math.round(IMAGE_UPLOAD_LIMITS.maxOutputFileBytes / (1024 * 1024))} MB cada · R2.
                </p>
              </div>
              <div className="space-y-2">
                {imagensPrep.map((prep, idx) => (
                  <NovaPecaImagemPrepRow
                    key={prep.id}
                    prep={prep}
                    index={idx}
                    disabled={pending}
                    onRemove={() => setImagensPrep((prev) => prev.filter((p) => p.id !== prep.id))}
                  />
                ))}
              </div>
              {imagensPrep.length < MAX_IMAGENS_NOVA_PECA ? (
                <ImageUploadField
                  key={novaImagemFieldKey}
                  label={
                    imagensPrep.length === 0
                      ? "Adicionar capa da vitrine (opcional)"
                      : `Adicionar foto ${imagensPrep.length + 1} de ${MAX_IMAGENS_NOVA_PECA} (galeria)`
                  }
                  description="JPEG, PNG ou WebP — comprimimos no navegador antes do envio."
                  disabled={pending}
                  onPrepared={(p) => {
                    setImagensPrep((prev) => {
                      if (prev.length >= MAX_IMAGENS_NOVA_PECA) return prev;
                      return [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          blob: p.blob,
                          filename: p.filename,
                          mimeType: p.mimeType,
                        },
                      ];
                    });
                    setNovaImagemFieldKey((k) => k + 1);
                  }}
                />
              ) : (
                <p className="text-xs text-muted-foreground">Limite de {MAX_IMAGENS_NOVA_PECA} fotos atingido.</p>
              )}
            </div>
          ) : null}
          <div className="space-y-3">
            <Label>Insumos e quantidades na montagem</Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Escolha o <strong className="text-foreground">fornecedor</strong> e o{" "}
              <strong className="text-foreground">insumo</strong> dele. O custo unitário na montagem vem do cadastro
              do insumo (fornecedor + frete até o executor, quando informados) e pode ser ajustado na aba{" "}
              <strong className="text-foreground">Peças e preços</strong>.
            </p>
            {lines.map((line, idx) => {
              const rowSupplies = suppliesForSupplier(supplies, line.supplierEmail);
              return (
                <div key={idx} className="flex flex-wrap items-center gap-2">
                <FornecedorPicker
                  options={supplierOptions}
                  value={line.supplierEmail}
                  onChange={(email) =>
                    setLines((prev) =>
                      prev.map((x, i) => {
                        if (i !== idx) return x;
                        const pool = suppliesForSupplier(supplies, email);
                        const keep = pool.some((s) => s.id === x.supplyItemId);
                        return {
                          ...x,
                          supplierEmail: email,
                          supplyItemId: keep ? x.supplyItemId : (pool[0]?.id ?? ""),
                        };
                      }),
                    )
                  }
                  disabled={pending}
                  ariaLabel={`Fornecedor na linha ${idx + 1}`}
                />
                <InsumoPicker
                  supplies={rowSupplies}
                  value={line.supplyItemId}
                  onChange={(v) =>
                    setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, supplyItemId: v } : x)))
                  }
                  disabled={pending || rowSupplies.length === 0}
                  ariaLabel={`Insumo na linha ${idx + 1}`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="h-11 min-h-0 w-28 rounded-md px-3 py-0 text-sm tabular-nums leading-none"
                    inputMode="decimal"
                    value={line.quantidade}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, quantidade: v } : x)));
                    }}
                    disabled={pending}
                    aria-label={`Quantidade linha ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={pending || !line.supplyItemId.trim()}
                    onClick={() => {
                      const s = rowSupplies.find((x) => x.id === line.supplyItemId);
                      if (!s) return;
                      const q = Number(line.quantidade.replace(",", "."));
                      setInsumoDetail({
                        item: s,
                        qtd: Number.isFinite(q) && q > 0 ? q : undefined,
                      });
                    }}
                  >
                    Ver detalhes
                  </Button>
                </div>
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
              );
            })}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                setLines((prev) => {
                  const next =
                    prev.length > 0
                      ? (() => {
                          const e = prev[prev.length - 1]!.supplierEmail;
                          const pool = suppliesForSupplier(supplies, e);
                          return {
                            supplierEmail: e,
                            supplyItemId: pool[0]?.id ?? "",
                            quantidade: "1",
                          };
                        })()
                      : initialNovaPecaLine(supplies);
                  return [...prev, next];
                })
              }
            >
              Adicionar insumo
            </Button>
          </div>
          <Button type="submit" disabled={pending}>
            {novaSaving ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Criar modelo
          </Button>
        </form>
      </CardContent>
    </Card>
    <SupplyItemDetailModal
      open={insumoDetail !== null}
      onOpenChange={(o) => {
        if (!o) setInsumoDetail(null);
      }}
      item={insumoDetail?.item ?? null}
      quantidadeNaMontagem={insumoDetail?.qtd}
    />
    </>
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

function AdminPecaProductCard({
  product,
  supplyCatalog,
  marketplaceImagesEnabled,
  pending,
  pendingScope,
  run,
}: {
  product: DemoCompositeProduct;
  supplyCatalog: DemoSupplyItem[];
  marketplaceImagesEnabled: boolean;
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
}) {
  const [open, setOpen] = useState(false);
  const [insumoMontagemDetail, setInsumoMontagemDetail] = useState<{
    item: DemoSupplyItem;
    quantidadeNaMontagem: number;
    custoUnitarioMontagem: number;
  } | null>(null);
  const freteB2B = product.frete_insumos_atribuicao_reais ?? null;
  const freteBreakdown = useMemo(
    () => demoFreteB2BBreakdownForCompositeProduct(product, undefined, supplyCatalog),
    [product, supplyCatalog],
  );
  const freteScale =
    freteB2B != null && freteBreakdown.freteTotal > 0 ? freteB2B / freteBreakdown.freteTotal : 1;
  const insumoTotal = compositeInsumosTotal(product);
  const materiaisMaisFrete =
    freteB2B != null ? insumoTotal + freteB2B : null;
  const isPrevia = product.preco_venda_congelado !== true;
  /** Final congelado = gravado; antes disso = prévia sem frete B2B dos insumos. */
  const precoLojaCard =
    product.preco_venda_congelado === true
      ? product.preco_venda_publico
      : compositePrecoPreviaSemFreteB2B(product);
  const sPause = `peca-${product.id}-pause`;
  const sActive = `peca-${product.id}-active`;
  const sDelete = `peca-${product.id}-delete`;
  const sCover = `peca-${product.id}-cover`;
  const sGalAdd = `peca-${product.id}-gallery-add`;
  const tamanhosLabel = product.variacoes_tamanho?.length
    ? formatVariacoesTamanhosLabel(product.variacoes_tamanho)
    : null;

  const confirmDeletePeca = () => {
    if (
      !window.confirm(
        `Excluir definitivamente a peça “${product.nome}”? Na API isto apaga também combinações, pedidos de execução e linhas de cumprimento ligados a este modelo.`,
      )
    ) {
      return;
    }
    run(() => deleteCompositeProductAction(product.id, product.slug), sDelete);
  };

  return (
    <>
    <Card className={cn(ADMIN_CARD, "h-min w-full self-start shadow-none hover:shadow-lg")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`peca-detalhes-${product.id}`}
        id={`peca-resumo-${product.id}`}
        aria-label={open ? "Recolher detalhes da peça" : "Expandir detalhes da peça"}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 rounded-t-lg border-b border-border/40 p-4 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
          {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (Unsplash ou R2) */}
          <img
            src={product.imagem_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-md border border-border object-cover sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-serif text-base font-semibold leading-snug text-foreground sm:text-lg">
              {product.nome}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              <span className="font-mono text-foreground/90">{product.sku}</span>
              {tamanhosLabel ? (
                <>
                  <span className="mx-1 text-border">·</span>
                  {tamanhosLabel}
                </>
              ) : null}
            </p>
            <p className="text-sm font-medium tabular-nums text-foreground">
              {isPrevia ? "Prévia na loja (sem frete B2B dos insumos): " : "Preço na loja: "}
              {formatBrl(precoLojaCard)}
            </p>
            {isPrevia ? (
              <p className="text-xs leading-snug text-muted-foreground">
                O frete fornecedor → costureira entra no total após vincular uma costureira ou aprovar um pedido de
                serviço.
              </p>
            ) : null}
            {!isPrevia && freteB2B != null ? (
              <p className="text-xs leading-snug text-muted-foreground">
                Inclui frete dos insumos à costureira{" "}
                <span className="font-medium tabular-nums text-foreground">{formatBrl(freteB2B)}</span>
                {materiaisMaisFrete != null ? (
                  <>
                    {" "}
                    · Materiais + esse frete:{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {formatBrl(materiaisMaisFrete)}
                    </span>{" "}
                    (+ taxas no detalhe)
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 self-stretch">
            <div className="flex flex-wrap justify-end gap-1.5">
              <StatusChip ok={product.ativo} label={product.ativo ? "Ativa" : "Inativa"} />
              <StatusChip
                ok={!product.admin_pausado}
                label={product.admin_pausado ? "Pausada" : "Na vitrine"}
                muted={product.admin_pausado}
              />
            </div>
            <ChevronDown
              aria-hidden
              className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            />
          </div>
      </button>

      {open ? (
        <div id={`peca-detalhes-${product.id}`} role="region" aria-labelledby={`peca-resumo-${product.id}`}>
          <div className="space-y-3 border-b border-border/30 bg-muted/10 px-4 pb-4 pt-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={product.admin_pausado ? "default" : "outline"}
                size="sm"
                disabled={pending}
                onClick={() => run(() => setProductAdminPaused(product.id, !product.admin_pausado), sPause)}
              >
                {adminActionLoading(pending, pendingScope, sPause) ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : null}
                {product.admin_pausado ? "Voltar a mostrar na vitrine" : "Pausar na vitrine"}
              </Button>
              <Button
                type="button"
                variant={product.ativo ? "outline" : "default"}
                size="sm"
                disabled={pending}
                onClick={() => run(() => setProductActive(product.id, !product.ativo), sActive)}
              >
                {adminActionLoading(pending, pendingScope, sActive) ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : null}
                {product.ativo ? "Desativar peça" : "Ativar peça"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="border-destructive/80"
                disabled={pending}
                onClick={confirmDeletePeca}
              >
                {adminActionLoading(pending, pendingScope, sDelete) ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : null}
                Excluir peça
              </Button>
            </div>
          </div>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/5 p-4 sm:flex-row sm:items-start">
              <div className="space-y-2 shrink-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Foto na loja</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (Unsplash ou R2) */}
                <img
                  src={product.imagem_url}
                  alt=""
                  className="h-40 w-full max-w-[200px] rounded-md border border-border object-cover sm:h-36 sm:w-36"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {marketplaceImagesEnabled ? (
                  <ImageUploadField
                    label="Substituir imagem da vitrine"
                    description={`JPEG, PNG ou WebP · comprimimos no navegador (WebP ou JPEG) até ${Math.round(IMAGE_UPLOAD_LIMITS.maxOutputFileBytes / (1024 * 1024))} MB · envio para Cloudflare R2 via API.`}
                    disabled={pending}
                    onPrepared={(prep) => {
                      run(async () => {
                        const f = new File([prep.blob], prep.filename, { type: prep.mimeType });
                        const fd = new FormData();
                        fd.append("file", f);
                        await uploadMarketplaceProductImage(product.id, fd, product.slug);
                      }, sCover);
                    }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    O envio de arquivos fica disponível quando a API e o R2 estiverem configurados (ver aviso acima).
                  </p>
                )}
              </div>
            </div>

            {marketplaceImagesEnabled ? (
              <div className="rounded-lg border border-border/60 bg-muted/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Galeria na página do produto
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A primeira imagem é sempre a <strong className="text-foreground">capa</strong> acima. Até 8 fotos
                  extra em carrossel na ficha pública (ampliar / zoom).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(product.galeria_imagens ?? [])
                    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
                    .map((url, galIdx) => {
                    const sGalDel = `peca-${product.id}-gal-del-${galIdx}`;
                    return (
                      <div
                        key={url}
                        className="group relative h-20 w-20 overflow-hidden rounded-md border border-border bg-background"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute right-0.5 top-0.5 h-7 px-1.5 text-[0.65rem] opacity-90 group-hover:opacity-100"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () =>
                                removeMarketplaceProductGalleryImageAction(product.id, product.slug, url),
                              sGalDel,
                            )
                          }
                        >
                          {adminActionLoading(pending, pendingScope, sGalDel) ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            "✕"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <ImageUploadField
                    label="Adicionar foto à galeria"
                    description={`WebP ou JPEG até ${Math.round(IMAGE_UPLOAD_LIMITS.maxOutputFileBytes / (1024 * 1024))} MB · máx. 8 fotos extra.`}
                    disabled={pending}
                    onPrepared={(prep) => {
                      run(async () => {
                        const f = new File([prep.blob], prep.filename, { type: prep.mimeType });
                        const fd = new FormData();
                        fd.append("file", f);
                        await uploadMarketplaceProductGalleryImage(product.id, product.slug, fd);
                      }, sGalAdd);
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Materiais usados neste modelo
              </h3>
              <div className="mt-3 space-y-6 rounded-lg border border-border/80 p-4">
                {freteBreakdown.slices.map((slice) => (
                  <div key={slice.supplierKey}>
                    <p className="text-sm font-semibold text-foreground">
                      Insumos — {slice.supplierLabel}
                    </p>
                    <ul className="mt-2 divide-y divide-border rounded-md border border-border/60">
                      {slice.lines.map((row) => (
                        <li
                          key={`${row.supplyItemId}-${row.montagemIndex}`}
                          className="flex flex-col gap-2 px-4 py-3 text-base sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{row.insumo.nome}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <p className="text-sm text-muted-foreground">
                                {row.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
                                {row.insumo.unidade} · {formatBrl(row.snapshot_custo_unitario)} por{" "}
                                {row.insumo.unidade}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 shrink-0 text-xs"
                                onClick={() =>
                                  setInsumoMontagemDetail({
                                    item: row.insumo,
                                    quantidadeNaMontagem: row.quantidade,
                                    custoUnitarioMontagem: row.snapshot_custo_unitario,
                                  })
                                }
                              >
                                Ver detalhes
                              </Button>
                            </div>
                          </div>
                          <p className="shrink-0 text-base tabular-nums text-foreground">
                            {formatBrl(row.quantidade * row.snapshot_custo_unitario)}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-right text-sm text-muted-foreground">
                      Frete B2B (este fornecedor):{" "}
                      <span className="font-medium tabular-nums text-foreground">
                        {formatBrl(slice.frete * freteScale)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 space-y-1 text-right text-sm text-muted-foreground">
                <span className="block">
                  Soma dos materiais (montagem):{" "}
                  <span className="font-medium text-foreground">{formatBrl(insumoTotal)}</span>
                </span>
                {freteB2B != null ? (
                  <>
                    <span className="block">
                      Total frete insumos à costureira (soma por fornecedor):{" "}
                      <span className="font-medium text-foreground">{formatBrl(freteB2B)}</span>
                    </span>
                    <span className="block text-foreground">
                      Materiais + frete B2B:{" "}
                      <span className="font-semibold tabular-nums">
                        {materiaisMaisFrete != null ? formatBrl(materiaisMaisFrete) : "—"}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block">
                      Frete B2B estimado (soma por fornecedor):{" "}
                      <span className="font-medium text-foreground">
                        {formatBrl(freteBreakdown.freteTotal)}
                      </span>
                    </span>
                    <span className="block text-xs">
                      Após vincular costureira, o valor gravado usa o CEP informado na combinação (pode diferir
                      levemente desta estimativa).
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Valores de venda</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Estes números aparecem para o cliente e ajudam a calcular repasses.
              </p>
              <div className="mt-4">
                <PricingForm
                  product={product}
                  supplyCatalog={supplyCatalog}
                  pending={pending}
                  pendingScope={pendingScope}
                  run={run}
                />
              </div>
            </div>
          </CardContent>
        </div>
      ) : null}
    </Card>
    <SupplyItemDetailModal
      open={insumoMontagemDetail !== null}
      onOpenChange={(o) => {
        if (!o) setInsumoMontagemDetail(null);
      }}
      item={insumoMontagemDetail?.item ?? null}
      quantidadeNaMontagem={insumoMontagemDetail?.quantidadeNaMontagem}
      custoUnitarioMontagem={insumoMontagemDetail?.custoUnitarioMontagem}
    />
    </>
  );
}

export function AdminPecasPanel({
  products,
  supplyCatalogExtra,
  marketplaceImagesEnabled,
  pending,
  pendingScope,
  run,
}: {
  products: DemoCompositeProduct[];
  /** Insumos vindos da API para resolver linhas além do seed. */
  supplyCatalogExtra?: DemoSupplyItem[];
  marketplaceImagesEnabled: boolean;
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
}) {
  const supplyCatalog = mergeSupplyCatalog(supplyCatalogExtra ?? []);

  return (
    <div className="space-y-8">
      {!marketplaceImagesEnabled ? <MarketplaceImagesDisabledCallout /> : null}
      <SectionIntro title="Peças e preços">
        <p>
          Aqui estão <strong className="text-foreground">todos os valores</strong>: custo unitário de cada insumo na
          montagem, repasses, margem da loja e pacote ao cliente. A{" "}
          <strong className="text-foreground">prévia na loja</strong> não inclui o frete B2B dos insumos até vincular
          costureira; após a atribuição, o preço passa ao valor definitivo com esse frete. Novos modelos cadastre em{" "}
          <strong className="text-foreground">Cadastro de peça</strong>.{" "}
          <strong className="text-foreground">Pausar na vitrine</strong> esconde ofertas;{" "}
          <strong className="text-foreground">Desativar</strong> tira a peça das buscas.
        </p>
      </SectionIntro>

      <div className="grid gap-8 items-start xl:grid-cols-2">
        {products.map((product) => (
          <AdminPecaProductCard
            key={product.id}
            product={product}
            supplyCatalog={supplyCatalog}
            marketplaceImagesEnabled={marketplaceImagesEnabled}
            pending={pending}
            pendingScope={pendingScope}
            run={run}
          />
        ))}
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
  pendingScope,
  run,
}: {
  products: DemoCompositeProduct[];
  executionRequests: DemoExecutionRequest[];
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
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
                  const sApprove = `pedido-${r.id}-approve`;
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
                            onClick={() => run(() => approveExecutionRequest(r.id), sApprove)}
                          >
                            {adminActionLoading(pending, pendingScope, sApprove) ? (
                              <Loader2 className="animate-spin" aria-hidden />
                            ) : null}
                            Aceitar pedido
                          </Button>
                          <RejectInline
                            requestId={r.id}
                            pending={pending}
                            pendingScope={pendingScope}
                            run={run}
                          />
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
  pendingScope,
  run,
}: {
  products: DemoCompositeProduct[];
  productionAssignments: DemoProductionAssignment[];
  executorOptions: ExecutorPickerOption[];
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
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
        <p className="mt-3">
          <strong className="text-foreground">Destaque na loja:</strong> para ofertas já publicadas, defina
          a ordem no carrossel do topo da página Loja (0 = primeiro slide). Vazio + OK remove do destaque; se
          nenhuma tiver ordem, a loja usa a primeira oferta do catálogo como antes.
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
                <table className="w-full min-w-[760px] text-left text-base">
                  <thead className="border-b border-border/60 bg-gradient-to-r from-muted/60 to-muted/25 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">Peça</th>
                      <th className="px-4 py-3.5 font-semibold">Costureira</th>
                      <th className="px-4 py-3.5 font-semibold">Situação</th>
                      <th className="px-4 py-3.5 font-semibold">Como entrou</th>
                      <th className="px-4 py-3.5 text-right font-semibold">À venda (un.)</th>
                      <th className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">
                        Destaque loja
                      </th>
                      <th className="px-4 py-3.5 text-right font-semibold"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleAssignments.map((a) => {
                      const p = products.find((x) => x.id === a.compositeProductId);
                      const sArchive = `comb-${a.id}-archive`;
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
                            <StorefrontHighlightOrderCell
                              assignmentId={a.id}
                              initialOrder={a.storefront_highlight_order}
                              pending={pending}
                              pendingScope={pendingScope}
                              run={run}
                            />
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={pending}
                              onClick={() => run(() => archiveProductionAssignment(a.id), sArchive)}
                            >
                              {adminActionLoading(pending, pendingScope, sArchive) ? (
                                <Loader2 className="animate-spin" aria-hidden />
                              ) : null}
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
          productionAssignments={productionAssignments}
          executorOptions={executorOptions}
          pending={pending}
          pendingScope={pendingScope}
          run={run}
        />
      </div>
    </div>
  );
}

function pricingLineCostsInitial(product: DemoCompositeProduct, catalog: DemoSupplyItem[]): string[] {
  return product.linhas.map((l) => {
    if (l.snapshot_custo_unitario > 0) return String(l.snapshot_custo_unitario);
    const ins = catalog.find((s) => s.id === l.supplyItemId);
    return String(ins ? insumoCostTotal(ins) : 0);
  });
}

function PricingForm({
  product,
  supplyCatalog,
  pending,
  pendingScope,
  run,
}: {
  product: DemoCompositeProduct;
  supplyCatalog: DemoSupplyItem[];
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
}) {
  const scope = `pricing-${product.id}`;
  const saving = adminActionLoading(pending, pendingScope, scope);
  const [execFee, setExecFee] = useState(String(product.executor_fee_planejada));
  const [platFee, setPlatFee] = useState(String(product.platform_fee_planejada));
  const pd0 = pacoteDefaults(product);
  const [pacAlt, setPacAlt] = useState(String(pd0.pacote_altura_cm));
  const [pacLar, setPacLar] = useState(String(pd0.pacote_largura_cm));
  const [pacComp, setPacComp] = useState(String(pd0.pacote_comprimento_cm));
  const [pacPeso, setPacPeso] = useState(String(pd0.pacote_peso_kg));
  const [lineCosts, setLineCosts] = useState<string[]>(() => pricingLineCostsInitial(product, supplyCatalog));
  const [insumoPricingDetail, setInsumoPricingDetail] = useState<{
    item: DemoSupplyItem;
    quantidadeNaMontagem: number;
    custoUnitarioMontagem: number;
  } | null>(null);

  const montagemPorFornecedor = useMemo(
    () => demoFreteB2BBreakdownForCompositeProduct(product, undefined, supplyCatalog).slices,
    [product, supplyCatalog],
  );

  useEffect(() => {
    setExecFee(String(product.executor_fee_planejada));
    setPlatFee(String(product.platform_fee_planejada));
    const pd = pacoteDefaults(product);
    setPacAlt(String(pd.pacote_altura_cm));
    setPacLar(String(pd.pacote_largura_cm));
    setPacComp(String(pd.pacote_comprimento_cm));
    setPacPeso(String(pd.pacote_peso_kg));
    setLineCosts(
      product.linhas.map((l) => {
        if (l.snapshot_custo_unitario > 0) return String(l.snapshot_custo_unitario);
        const ins = supplyCatalog.find((s) => s.id === l.supplyItemId);
        const fallback = ins ? insumoCostTotal(ins) : 0;
        return String(fallback);
      }),
    );
  }, [product, supplyCatalog]);

  const frozen = product.preco_venda_congelado === true;
  const execParsed = Number(execFee.replace(",", "."));
  const platParsed = Number(platFee.replace(",", "."));
  const freteRef = product.frete_insumos_atribuicao_reais ?? 0;

  const linhasEditadas: DemoCompositeProduct["linhas"] = product.linhas.map((l, i) => ({
    ...l,
    snapshot_custo_unitario: Number((lineCosts[i] ?? "0").replace(",", ".")),
  }));
  const custosLinhasValidos =
    lineCosts.length === product.linhas.length &&
    linhasEditadas.every(
      (l) => Number.isFinite(l.snapshot_custo_unitario) && l.snapshot_custo_unitario >= 0,
    );
  const materiaisRef = custosLinhasValidos ? compositeInsumosTotal({ ...product, linhas: linhasEditadas }) : null;
  const feesValid =
    Number.isFinite(execParsed) &&
    execParsed >= 0 &&
    Number.isFinite(platParsed) &&
    platParsed >= 0;
  const precoLojaCalculado =
    custosLinhasValidos && feesValid
      ? compositePrecoFromLinhasAndFees(linhasEditadas, execParsed, platParsed, freteRef)
      : null;

  return (
    <>
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const pacote_altura_cm = Number(pacAlt.replace(",", "."));
        const pacote_largura_cm = Number(pacLar.replace(",", "."));
        const pacote_comprimento_cm = Number(pacComp.replace(",", "."));
        const pacote_peso_kg = Number(pacPeso.replace(",", "."));
        if (frozen) {
          run(
            () =>
              updateCompositeProductPricing({
                productId: product.id,
                executor_fee_planejada: product.executor_fee_planejada,
                platform_fee_planejada: product.platform_fee_planejada,
                pacote_altura_cm,
                pacote_largura_cm,
                pacote_comprimento_cm,
                pacote_peso_kg,
              }),
            scope,
          );
          return;
        }
        if (!custosLinhasValidos || !feesValid) return;
        run(
          () =>
            updateCompositeProductPricing({
              productId: product.id,
              executor_fee_planejada: Number(execFee.replace(",", ".")),
              platform_fee_planejada: Number(platFee.replace(",", ".")),
              pacote_altura_cm,
              pacote_largura_cm,
              pacote_comprimento_cm,
              pacote_peso_kg,
              linhas: product.linhas.map((l, i) => ({
                supply_item_id: l.supplyItemId,
                quantidade: l.quantidade,
                snapshot_custo_unitario: linhasEditadas[i]!.snapshot_custo_unitario,
              })),
            }),
          scope,
        );
      }}
    >
      {frozen ? (
        <p className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2.5 text-sm text-muted-foreground">
          O preço ao cliente desta peça foi <strong className="text-foreground">fixado</strong> ao vincular
          costureira e cotar o frete B2B dos insumos; custos por insumo, taxas e preço não podem ser alterados por
          aqui. Você ainda pode ajustar o <strong className="text-foreground">pacote ao cliente</strong>.
        </p>
      ) : null}
      <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
        <h4 className="text-sm font-semibold text-foreground">Custo unitário na montagem (R$)</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Valor por unidade de cada insumo nesta peça (o total na linha = quantidade × unitário). A montagem em si
          continua em <strong className="text-foreground">Cadastro de peça</strong>.
        </p>
        <div className="mt-3 space-y-6">
          {montagemPorFornecedor.map((slice) => (
            <div key={slice.supplierKey}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Insumos — {slice.supplierLabel}
              </p>
              <ul className="mt-2 space-y-3">
                {slice.lines.map((row) => {
                  const idx = row.montagemIndex;
                  return (
                    <li
                      key={`${row.supplyItemId}-${idx}`}
                      className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-3 sm:flex-row sm:items-end sm:justify-between"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm font-medium leading-snug text-foreground">{row.insumo.nome}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-xs text-muted-foreground">
                            Qtd. na peça:{" "}
                            <span className="font-medium tabular-nums text-foreground">{row.quantidade}</span>
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              const parsed = Number((lineCosts[idx] ?? "0").replace(",", "."));
                              setInsumoPricingDetail({
                                item: row.insumo,
                                quantidadeNaMontagem: row.quantidade,
                                custoUnitarioMontagem:
                                  Number.isFinite(parsed) && parsed >= 0 ? parsed : row.snapshot_custo_unitario,
                              });
                            }}
                          >
                            Ver detalhes
                          </Button>
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-1.5 sm:w-40 sm:shrink-0">
                        <Label htmlFor={`custo-linha-${product.id}-${idx}`} className="text-xs font-medium">
                          R$ / un.
                        </Label>
                        <Input
                          id={`custo-linha-${product.id}-${idx}`}
                          value={lineCosts[idx] ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLineCosts((prev) => {
                              const next = [...prev];
                              next[idx] = v;
                              return next;
                            });
                          }}
                          disabled={pending || frozen}
                          inputMode="decimal"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
        <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preço na loja (R$)</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {precoLojaCalculado !== null ? formatBrl(precoLojaCalculado) : "—"}
          </p>
          <p className="text-[0.7rem] leading-snug text-muted-foreground">
            Materiais ({materiaisRef !== null ? formatBrl(materiaisRef) : "—"})
            {freteRef > 0 ? (
              <>
                {" "}
                + frete insumos ({formatBrl(freteRef)})
              </>
            ) : null}{" "}
            + costureira + margem loja
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`exec-${product.id}`} className="font-medium leading-snug">
            Valor previsto para a costureira (R$)
          </Label>
          <Input
            id={`exec-${product.id}`}
            value={execFee}
            onChange={(e) => setExecFee(e.target.value)}
            disabled={pending || frozen}
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
            disabled={pending || frozen}
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
              disabled={pending}
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
              disabled={pending}
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
              disabled={pending}
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
              disabled={pending}
              inputMode="decimal"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          size="sm"
          disabled={pending || (!frozen && (!custosLinhasValidos || !feesValid))}
        >
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {frozen ? "Salvar pacote (envio ao cliente)" : "Salvar valores"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Materiais na montagem:{" "}
          <span className="font-medium tabular-nums text-foreground">
            {materiaisRef !== null ? formatBrl(materiaisRef) : "—"}
          </span>
          {freteRef > 0 ? (
            <>
              {" "}
              · Frete B2B insumos (soma por fornecedor):{" "}
              <span className="font-medium tabular-nums text-foreground">{formatBrl(freteRef)}</span>
            </>
          ) : null}
          {precoLojaCalculado !== null ? (
            <>
              {" "}
              · Preço ao cliente:{" "}
              <span className="font-medium tabular-nums text-foreground">{formatBrl(precoLojaCalculado)}</span>
            </>
          ) : null}
        </p>
      </div>
    </form>
    <SupplyItemDetailModal
      open={insumoPricingDetail !== null}
      onOpenChange={(o) => {
        if (!o) setInsumoPricingDetail(null);
      }}
      item={insumoPricingDetail?.item ?? null}
      quantidadeNaMontagem={insumoPricingDetail?.quantidadeNaMontagem}
      custoUnitarioMontagem={insumoPricingDetail?.custoUnitarioMontagem}
    />
    </>
  );
}

function RejectInline({
  requestId,
  pending,
  pendingScope,
  run,
}: {
  requestId: string;
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
}) {
  const scope = `reject-${requestId}`;
  const saving = adminActionLoading(pending, pendingScope, scope);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setOpen(true)}>
        Recusar…
      </Button>
    );
  }
  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => rejectExecutionRequest(requestId, reason), scope);
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
          disabled={pending}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={pending}>
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Confirmar recusa
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
          Voltar
        </Button>
      </div>
    </form>
  );
}

function DirectAssignForm({
  products,
  productionAssignments,
  executorOptions,
  pending,
  pendingScope,
  run,
}: {
  products: DemoCompositeProduct[];
  productionAssignments: DemoProductionAssignment[];
  executorOptions: ExecutorPickerOption[];
  pending: boolean;
  pendingScope: string | null;
  run: AdminMutationRun;
}) {
  const scope = "direct-assign";
  const saving = adminActionLoading(pending, pendingScope, scope);
  const assignableProducts = useMemo(() => {
    return products.filter(
      (p) => !compositeProductHasActiveAssignment(p.id, productionAssignments),
    );
  }, [products, productionAssignments]);
  const [productId, setProductId] = useState("");
  const [executorEmail, setExecutorEmail] = useState(() => executorOptions[0]?.email ?? "");

  useEffect(() => {
    if (assignableProducts.length === 0) {
      setProductId("");
      return;
    }
    setProductId((prev) =>
      assignableProducts.some((p) => p.id === prev) ? prev : assignableProducts[0].id,
    );
  }, [assignableProducts]);

  useEffect(() => {
    if (executorOptions.length === 0) return;
    const still = executorOptions.some((o) => o.email === executorEmail);
    if (!still) setExecutorEmail(executorOptions[0].email);
  }, [executorOptions, executorEmail]);

  const selectedExecutor = executorOptions.find((o) => o.email === executorEmail);
  const postingFromProfile =
    selectedExecutor &&
    selectedExecutor.cidade_origem.trim() &&
    selectedExecutor.cep_origem.trim();

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

  if (assignableProducts.length === 0) {
    return (
      <Card className={cn(ADMIN_CARD, "max-w-2xl")}>
        <CardHeader className={ADMIN_CARD_HEADER}>
          <CardTitle className="font-serif text-xl">Nova combinação peça + costureira</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Todas as peças já têm uma combinação ativa (em andamento). Para vincular outra costureira
            a um modelo, encerre a combinação atual dele na tabela acima — ou crie uma peça nova no
            catálogo.
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
          Só aparecem peças que ainda não têm combinação ativa. Escolha a costureira na lista (nome e
          e-mail vêm do cadastro). Use quando você quer definir diretamente quem faz um modelo, sem
          passar pelo pedido dela.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedExecutor || !productId || !postingFromProfile) return;
            run(
              () =>
                createDirectAssignment({
                  compositeProductId: productId,
                  executorEmail: selectedExecutor.email,
                  executorNome: selectedExecutor.displayName,
                  cidade_origem: selectedExecutor.cidade_origem.trim(),
                  cep_origem: selectedExecutor.cep_origem.trim(),
                }),
              scope,
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
              disabled={pending}
            >
              {assignableProducts.map((p) => (
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
              disabled={pending}
            >
              {executorOptions.map((o) => (
                <option key={o.email} value={o.email}>
                  {o.displayName} — {o.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
            <p className="text-sm font-medium text-foreground">Origem de postagem (cadastro da costureira)</p>
            {postingFromProfile ? (
              <p className="text-sm text-muted-foreground">
                {selectedExecutor!.cidade_origem.trim()}
                <span className="mx-1.5 text-border">·</span>
                CEP {selectedExecutor!.cep_origem.trim()}
              </p>
            ) : (
              <p className="text-sm text-destructive">
                Esta costureira ainda não tem CEP e cidade no perfil. Peça que complete o cadastro no
                painel da costureira antes de vincular a peça.
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={pending || !selectedExecutor || !productId || !postingFromProfile}
            >
              {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Salvar combinação
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
