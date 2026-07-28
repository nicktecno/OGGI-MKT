"use client";

import { useState } from "react";
import { PaymentMethod, PontoReferencia } from "@/lib/beach-marketplace/types";
import { formatBrl } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  QrCode,
  CreditCard,
  Banknote,
  AlertCircle,
} from "lucide-react";

export interface CheckoutData {
  nome: string;
  sobrenome: string;
  whatsapp: string;
  metodoPagamento: PaymentMethod;
  trocoPara?: number;
  usarLocalizacao: boolean;
  pontoReferenciaId?: string;
}

interface BeachCheckoutFormProps {
  pontosReferencia: PontoReferencia[];
  total: number;
  onBack: () => void;
  onConfirm: (data: CheckoutData) => void;
  submitting?: boolean;
  locationError?: string | null;
}

const PAGAMENTOS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "PIX", label: "Pix", icon: <QrCode className="w-4 h-4" /> },
  { value: "CARTAO", label: "Cartão", icon: <CreditCard className="w-4 h-4" /> },
  { value: "DINHEIRO", label: "Dinheiro", icon: <Banknote className="w-4 h-4" /> },
];

export function BeachCheckoutForm({
  pontosReferencia,
  total,
  onBack,
  onConfirm,
  submitting = false,
  locationError = null,
}: BeachCheckoutFormProps) {
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<PaymentMethod>("PIX");
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoPara, setTrocoPara] = useState("");
  const [usarLocalizacao, setUsarLocalizacao] = useState(true);
  const [pontoReferenciaId, setPontoReferenciaId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nome.trim() || !sobrenome.trim()) {
      setError("Informe seu nome e sobrenome.");
      return;
    }
    if (!whatsapp.trim()) {
      setError("Informe seu WhatsApp para contato.");
      return;
    }
    if (!usarLocalizacao && !pontoReferenciaId) {
      setError("Escolha um ponto de referência ou volte para usar sua localização.");
      return;
    }

    onConfirm({
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      whatsapp: whatsapp.trim(),
      metodoPagamento,
      trocoPara:
        metodoPagamento === "DINHEIRO" && precisaTroco && trocoPara
          ? Number(trocoPara)
          : undefined,
      usarLocalizacao,
      pontoReferenciaId: usarLocalizacao ? undefined : pontoReferenciaId,
    });
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal";

  return (
    <form onSubmit={handleSubmit} className="loslos-card p-5 space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-loslos-teal hover:text-loslos-teal-dark transition"
          aria-label="Voltar ao carrinho"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="font-black text-foreground">Finalizar pedido</h3>
      </div>

      {/* Dados de entrega */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Dados para entrega
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="given-name"
          />
          <input
            className={inputClass}
            placeholder="Sobrenome"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            autoComplete="family-name"
          />
        </div>
        <input
          className={inputClass}
          placeholder="WhatsApp (ex: 21 99999-0000)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
        />
      </div>

      {/* Forma de pagamento */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Forma de pagamento
        </p>
        <p className="text-[11px] text-muted-foreground -mt-1">
          O pagamento é feito diretamente com o ambulante na entrega.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PAGAMENTOS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setMetodoPagamento(p.value)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                metodoPagamento === p.value
                  ? "border-loslos-teal bg-primary/10 text-loslos-teal"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>

        {metodoPagamento === "DINHEIRO" && (
          <div className="space-y-2 rounded-xl bg-secondary/60 p-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={precisaTroco}
                onChange={(e) => setPrecisaTroco(e.target.checked)}
                className="accent-loslos-teal"
              />
              Preciso de troco
            </label>
            {precisaTroco && (
              <input
                className={inputClass}
                placeholder="Troco para quanto? (ex: 50)"
                value={trocoPara}
                onChange={(e) => setTrocoPara(e.target.value.replace(/[^0-9.,]/g, ""))}
                inputMode="decimal"
              />
            )}
          </div>
        )}
      </div>

      {/* Localização ou ponto de referência */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Onde te encontrar
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUsarLocalizacao(true)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
              usarLocalizacao
                ? "border-loslos-teal bg-primary/10 text-loslos-teal"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Navigation className="w-4 h-4" />
            Minha localização
          </button>
          <button
            type="button"
            onClick={() => setUsarLocalizacao(false)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
              !usarLocalizacao
                ? "border-loslos-teal bg-primary/10 text-loslos-teal"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Ponto de referência
          </button>
        </div>

        {usarLocalizacao ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Navigation className="w-3 h-3 text-loslos-teal" />
            Ao confirmar, vamos pedir sua localização para o ambulante te encontrar.
          </p>
        ) : pontosReferencia.length > 0 ? (
          <select
            className={inputClass}
            value={pontoReferenciaId}
            onChange={(e) => setPontoReferenciaId(e.target.value)}
          >
            <option value="">Selecione um ponto de referência…</option>
            {pontosReferencia.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
                {p.descricao ? ` — ${p.descricao}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Nenhum ponto de referência cadastrado nesta praia. Use sua localização.
          </p>
        )}
      </div>

      {(error || locationError) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error || locationError}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-black text-lg text-loslos-teal">{formatBrl(total)}</span>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-loslos-teal-dark text-white font-black h-12 rounded-xl hover:bg-loslos-teal transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Enviando pedido..." : "Confirmar pedido"}
      </button>
    </form>
  );
}
