"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  findNearestStore,
  formatCepDisplay,
} from "@/lib/oggi-fest/nearest-store";
import type { OggiStore } from "@/lib/oggi-fest/types";
import { applyViaCepOnBlur, onlyCepDigits } from "@/lib/viacep";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

type Props = {
  open: boolean;
  stores: OggiStore[];
  initialCep?: string;
  onConfirm: (cep: string, nearestStore: OggiStore | null) => void;
  onCancel: () => void;
};

export function FestNearestStoreCepModal({
  open,
  stores,
  initialCep = "",
  onConfirm,
  onCancel,
}: Props) {
  const [cep, setCep] = useState(initialCep);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCep(initialCep);
      setError("");
    }
  }, [open, initialCep]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const digits = onlyCepDigits(cep);
  const nearest = digits.length === 8 ? findNearestStore(stores, digits) : null;

  function submit() {
    if (digits.length !== 8) {
      setError("Informe um CEP válido com 8 dígitos.");
      return;
    }
    onConfirm(digits, nearest);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fest-cep-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onCancel}
      />
      <div
        className={cn(
          "relative z-10 flex w-full max-h-[min(90vh,520px)] flex-col overflow-hidden",
          "rounded-t-2xl border-2 border-primary/20 bg-background shadow-xl sm:max-w-md sm:rounded-2xl",
        )}
      >
        <div className="border-b-2 border-primary/15 bg-primary px-5 py-4 text-primary-foreground">
          <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.3em] text-primary-foreground/80">
            Antes de finalizar
          </p>
          <h2
            id="fest-cep-modal-title"
            className="mt-1 font-heading text-lg font-extrabold uppercase tracking-wide"
          >
            Loja mais próxima
          </h2>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Informe seu CEP para indicarmos a unidade Oggi mais próxima para retirada do carrinho.
          </p>
          <div className="space-y-2">
            <Label htmlFor="fest-pickup-cep">Seu CEP</Label>
            <Input
              id="fest-pickup-cep"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => {
                setCep(e.target.value);
                setError("");
              }}
              onBlur={(e) => {
                void applyViaCepOnBlur(e.currentTarget.value, (v) => {
                  setCep(onlyCepDigits(v.cep));
                });
              }}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          {nearest ? (
            <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-accent">Loja indicada</p>
              <p className="mt-1 font-semibold">{nearest.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {nearest.address} — {nearest.city}/{nearest.uf}
              </p>
              {nearest.distanceKm != null ? (
                <p className="mt-2 flex items-center gap-1 text-sm text-accent">
                  <MapPin className="h-3.5 w-3.5" />
                  ~{nearest.distanceKm} km do CEP {formatCepDisplay(digits)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2 border-t-2 border-primary/15 bg-muted/30 px-5 py-4">
          <Button type="button" className="w-full" size="lg" onClick={submit}>
            Continuar e finalizar
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onCancel}>
            Voltar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
