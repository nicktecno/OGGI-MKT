"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onlyCepDigits } from "@/lib/viacep";
import { formatBrl } from "@/lib/utils";

type Props = {
  listingId: string;
  /** Estoque da oferta (limita quantidade na cotação). */
  maxQuantity: number;
  className?: string;
};

export function ProductShippingQuote({ listingId, maxQuantity, className }: Props) {
  const [cep, setCep] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freightBrl, setFreightBrl] = useState<number | null>(null);
  const [freightEstimated, setFreightEstimated] = useState(false);

  if (maxQuantity < 1) return null;

  async function handleQuote() {
    const digits = onlyCepDigits(cep);
    if (digits.length !== 8) {
      setError("Informe o CEP com 8 dígitos.");
      setFreightBrl(null);
      return;
    }
    const q = Math.min(Math.max(1, Math.floor(quantity)), maxQuantity);
    setLoading(true);
    setError(null);
    setFreightBrl(null);
    setFreightEstimated(false);
    try {
      const res = await fetch("/api/checkout/shipping-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep_destino: digits,
          lines: [{ listing_id: listingId, quantity: q }],
        }),
      });
      const data = (await res.json()) as {
        total_frete_brl?: number;
        freight_estimated?: boolean;
        message?: string;
      };
      if (!res.ok) {
        setError(typeof data.message === "string" ? data.message : "Não foi possível calcular o frete.");
        return;
      }
      if (typeof data.total_frete_brl !== "number" || !Number.isFinite(data.total_frete_brl)) {
        setError("Resposta inválida do servidor.");
        return;
      }
      setFreightBrl(data.total_frete_brl);
      setFreightEstimated(data.freight_estimated === true);
    } catch {
      setError("Erro de rede. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg">Calcular frete</CardTitle>
        <CardDescription>
          Estimativa de envio desta oferta até o CEP informado (mesma base usada ao finalizar a compra).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="pq-cep">CEP de destino</Label>
            <Input
              id="pq-cep"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              className="max-w-[14rem] font-mono tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pq-qty">Quantidade</Label>
            <Input
              id="pq-qty"
              type="number"
              min={1}
              max={maxQuantity}
              className="w-20 font-mono tabular-nums"
              value={quantity}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) {
                  setQuantity(1);
                  return;
                }
                setQuantity(Math.min(Math.max(1, n), maxQuantity));
              }}
            />
          </div>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {freightBrl !== null ? (
          <div className="space-y-1 text-sm text-foreground">
            <p>
              Frete estimado:{" "}
              <span className="font-serif text-lg font-medium tabular-nums">{formatBrl(freightBrl)}</span>
            </p>
            {freightEstimated ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Valor por estimativa interna (a transportadora não retornou cotação para esta rota). O
                frete final pode ser confirmado ao finalizar a compra.
              </p>
            ) : null}
          </div>
        ) : null}
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void handleQuote()}>
          {loading ? "Calculando…" : "Calcular frete"}
        </Button>
      </CardContent>
    </Card>
  );
}
