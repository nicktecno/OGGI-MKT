"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { solicitarProducaoAction } from "@/app/(painel)/painel/executor/executor-producao-actions";
import { formatVariacoesTamanhosLabel } from "@/lib/product-sizes";
import { productImageSlides, type DemoCompositeProduct } from "@/lib/demo-seed";
import { cn, formatBrl } from "@/lib/utils";

function PecaDetalheModal({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: DemoCompositeProduct | null;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!open || !product || typeof document === "undefined") return null;

  const slides = productImageSlides(product);
  const tamanhosLabel = product.variacoes_tamanho?.length
    ? formatVariacoesTamanhosLabel(product.variacoes_tamanho)
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="executor-peca-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-[1] flex max-h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
          <h2
            id="executor-peca-modal-title"
            className="font-serif text-lg font-semibold leading-snug text-foreground sm:text-xl"
          >
            {product.nome}
          </h2>
          <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {slides.length > 0 ? (
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Fotos</p>
              <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
                {slides.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="shrink-0 overflow-hidden rounded-xl border border-border bg-muted/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- URLs R2 ou externas */}
                    <img
                      src={url}
                      alt=""
                      className="max-h-[min(48vh,380px)] w-auto max-w-[min(100vw-3rem,520px)] object-contain object-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mb-5 text-sm text-muted-foreground">Esta peça não tem imagens na vitrine.</p>
          )}
          <dl className="space-y-3 text-sm">
            <DetailLine label="SKU" value={<span className="font-mono">{product.sku}</span>} />
            {tamanhosLabel ? <DetailLine label="Tamanhos" value={tamanhosLabel} /> : null}
            <DetailLine
              label="Preço na loja (referência)"
              value={<span className="tabular-nums">{formatBrl(product.preco_venda_publico)}</span>}
            />
            <div className="border-t border-border/40 pt-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</dt>
              <dd className="mt-1.5 leading-relaxed text-foreground">{product.descricao_curta}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

export function ExecutorSolicitarProducao({ products }: { products: DemoCompositeProduct[] }) {
  const [productId, setProductId] = useState<string>(products[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (products.length === 0) return;
    const still = products.some((p) => p.id === productId);
    if (!still) setProductId(products[0]!.id);
  }, [products, productId]);

  const selected = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Não há peças disponíveis para novo pedido (já atribuídas a uma costureira ou com seu pedido
        pendente).
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (!productId) return;
    setPending(true);
    try {
      await solicitarProducaoAction(productId);
      setOk(
        "Pedido enviado. Os administradores recebem um e-mail quando o servidor de e-mail estiver configurado.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o pedido.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pedido-peca">Peça</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              id="pedido-peca"
              className="flex h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" className="shrink-0 sm:h-10" onClick={() => setDetailOpen(true)}>
              Ver detalhes
            </Button>
          </div>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="text-sm text-muted-foreground" role="status">
            {ok}
          </p>
        ) : null}
        <Button type="submit" disabled={pending || !productId}>
          {pending ? "Enviando…" : "Pedir para executar esta peça"}
        </Button>
      </form>
      <PecaDetalheModal open={detailOpen} onOpenChange={setDetailOpen} product={selected} />
    </>
  );
}
