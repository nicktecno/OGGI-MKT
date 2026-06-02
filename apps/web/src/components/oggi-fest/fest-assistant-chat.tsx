"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { createAssistantOrder } from "@/lib/oggi-fest/assistant-build-order";
import {
  GUEST_RANGE_OPTIONS,
  OCCASION_OPTIONS,
  type GuestRange,
  type OccasionChoice,
  getCartBySlug,
  guestRangeLabel,
  occasionLabel,
  suggestCartSlug,
  suggestTemplate,
} from "@/lib/oggi-fest/assistant-suggest";
import {
  festOrderMeetsMinimum,
  festOrderSubtotal,
  writeFestOrder,
} from "@/lib/oggi-fest/cart-storage";
import { OGGI_FEST_MIN_ORDER_BRL } from "@/lib/oggi-fest/constants";
import type { FestCartModel, FestTemplate } from "@/lib/oggi-fest/types";
import { useFestCatalog } from "@/lib/oggi-fest/use-fest-catalog";
import { cn, formatBrl } from "@/lib/utils";
import { RotateCcw, X } from "lucide-react";

const RUDIGO_MASCOT = "/rudigo.png";

function RudigoAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-primary/25",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={RUDIGO_MASCOT}
        alt=""
        fill
        className="object-cover object-top"
        sizes={`${size}px`}
      />
    </span>
  );
}

/** Mascote “saindo” do modal — corpo para fora, pés na borda superior. */
function RudigoMascotPeek({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none relative h-[8.75rem] w-[7.25rem] drop-shadow-[0_8px_24px_rgba(226,0,122,0.35)]", className)}
      aria-hidden
    >
      <Image
        src={RUDIGO_MASCOT}
        alt=""
        fill
        priority
        className="object-contain object-bottom"
        sizes="116px"
      />
    </div>
  );
}

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

type Step = "welcome" | "guests" | "occasion" | "cart" | "model" | "done";

type Chip = { id: string; label: string };

let msgSeq = 0;
function nextMsgId() {
  msgSeq += 1;
  return `msg-${msgSeq}`;
}

export function FestAssistantChat() {
  const catalog = useFestCatalog();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [guests, setGuests] = useState<GuestRange | null>(null);
  const [occasion, setOccasion] = useState<OccasionChoice | null>(null);
  const [cart, setCart] = useState<FestCartModel | null>(null);
  const [template, setTemplate] = useState<FestTemplate | null>(null);
  const [summaryHref, setSummaryHref] = useState("/fest");
  const scrollRef = useRef<HTMLDivElement>(null);

  const pushBot = useCallback((text: string) => {
    setMessages((m) => [...m, { id: nextMsgId(), role: "bot", text }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages((m) => [...m, { id: nextMsgId(), role: "user", text }]);
  }, []);

  const reset = useCallback(() => {
    setStep("welcome");
    setGuests(null);
    setOccasion(null);
    setCart(null);
    setTemplate(null);
    setSummaryHref("/fest");
    setMessages([]);
    pushBot(
      "Olá! Sou o Rudigo, assistente do Oggi Fest. Em poucos passos monto seu carrinho com um modelo pronto. Quantos convidados você espera?",
    );
    setStep("guests");
  }, [pushBot]);

  useEffect(() => {
    if (!open || messages.length > 0) return;
    reset();
  }, [open, messages.length, reset]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  function toggleOpen() {
    setOpen((v) => !v);
  }

  function handleGuestsChoice(range: GuestRange) {
    const label = guestRangeLabel(range);
    pushUser(label);
    setGuests(range);
    setCart(getCartBySlug(suggestCartSlug(range)));
    pushBot("Qual é o tipo da festa?");
    setStep("occasion");
  }

  function handleOccasionChoice(choice: OccasionChoice) {
    const label = occasionLabel(choice);
    pushUser(label);
    setOccasion(choice);
    const tpl = suggestTemplate(catalog, choice);
    setTemplate(tpl ?? null);
    const suggested = getCartBySlug(suggestCartSlug(guests!));
    setCart(suggested);
    pushBot(
      `Para ${label.toLowerCase()}, sugiro o ${suggested.name} (${suggested.capacity} picolés). Está bom para você?`,
    );
    setStep("cart");
  }

  function handleCartConfirm(accept: boolean) {
    if (!guests || !occasion) return;
    let activeCart = cart ?? getCartBySlug(suggestCartSlug(guests));

    if (!accept) {
      const altSlug = activeCart.slug === "carrinho-200" ? "carrinho-300" : "carrinho-200";
      activeCart = getCartBySlug(altSlug);
      setCart(activeCart);
      pushUser(`Prefiro o ${activeCart.name}`);
      pushBot(`Combinado: ${activeCart.name} com ${activeCart.capacity} unidades.`);
    } else {
      pushUser("Sim, esse carrinho");
    }

    const tpl = template ?? suggestTemplate(catalog, occasion);
    if (!tpl) {
      pushBot(
        "Não encontrei um modelo pronto para essa ocasião. Você pode montar manualmente na vitrine.",
      );
      setSummaryHref(`/fest/${activeCart.slug}`);
      setStep("done");
      return;
    }
    setTemplate(tpl);
    pushBot(
      `Aplico o modelo "${tpl.name}"? Ele distribui as linhas Oggi automaticamente até completar ${activeCart.capacity} picolés.`,
    );
    setStep("model");
  }

  function handleModelConfirm(accept: boolean) {
    if (!guests || !occasion) return;
    const activeCart = cart ?? getCartBySlug(suggestCartSlug(guests));
    const tpl = template ?? suggestTemplate(catalog, occasion);
    if (!accept || !tpl) {
      pushUser("Montar manualmente");
      pushBot("Sem problemas! Escolha o carrinho na vitrine e monte do seu jeito.");
      setSummaryHref(`/fest/${activeCart.slug}`);
      setStep("done");
      return;
    }

    pushUser(`Usar modelo ${tpl.name}`);
    const order = createAssistantOrder(catalog, activeCart, tpl);
    writeFestOrder(order);
    const subtotal = festOrderSubtotal(order);
    const meetsMin = festOrderMeetsMinimum(order);
    pushBot(
      `Pronto! ${order.capacity} picolés · ${formatBrl(subtotal)}${
        meetsMin
          ? " · pedido mínimo atingido ✓"
          : ` · faltam ${formatBrl(OGGI_FEST_MIN_ORDER_BRL - subtotal)} para o mínimo`
      }. Modelo: ${tpl.name}.`,
    );
    setSummaryHref(`/fest/${activeCart.slug}`);
    setStep("done");
  }

  function handlePickOtherModel() {
    if (!occasion) return;
    const alternatives = catalog.templates.filter((t) => {
      if (occasion === "festa-junina") return t.slug === "festa-junina" || t.occasion === "infantil";
      return t.occasion === occasion;
    });
    if (alternatives.length <= 1) {
      pushBot("Só temos esse modelo para essa ocasião no momento.");
      return;
    }
    const current = template?.id;
    const next = alternatives.find((t) => t.id !== current) ?? alternatives[0];
    setTemplate(next);
    pushUser(`Quero o modelo ${next.name}`);
    pushBot(`Trocado para "${next.name}". Aplico esse modelo?`);
  }

  const chips: Chip[] = (() => {
    switch (step) {
      case "guests":
        return GUEST_RANGE_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
      case "occasion":
        return OCCASION_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
      case "cart":
        return [
          { id: "cart-yes", label: "Sim, esse carrinho" },
          {
            id: "cart-alt",
            label:
              cart?.slug === "carrinho-200" ? "Prefiro 300 unidades" : "Prefiro 200 unidades",
          },
        ];
      case "model":
        return [
          { id: "model-yes", label: "Aplicar modelo" },
          { id: "model-other", label: "Outro modelo" },
          { id: "model-manual", label: "Montar manualmente" },
        ];
      default:
        return [];
    }
  })();

  function onChip(id: string) {
    if (step === "guests") handleGuestsChoice(id as GuestRange);
    else if (step === "occasion") handleOccasionChoice(id as OccasionChoice);
    else if (step === "cart") handleCartConfirm(id === "cart-yes");
    else if (step === "model") {
      if (id === "model-yes") handleModelConfirm(true);
      else if (id === "model-other") handlePickOtherModel();
      else handleModelConfirm(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Wrapper do modal + mascote (overflow visível para o personagem “sair”) */}
      <div
        className={cn(
          "relative mb-3 w-[min(calc(100vw-2rem),440px)] transition-all duration-300 ease-out",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none h-0 translate-y-3 opacity-0",
        )}
      >
        <div
          className={cn(
            "absolute -left-1 -top-[5.25rem] z-30 transition-all duration-300 ease-out",
            open ? "scale-100 opacity-100" : "scale-90 opacity-0",
          )}
        >
          <RudigoMascotPeek />
        </div>

        <div
          id="fest-assistant-panel"
          role="dialog"
          aria-labelledby="fest-assistant-title"
          aria-hidden={!open}
          className={cn(
            "relative z-20 flex max-h-[min(82dvh,680px)] flex-col overflow-hidden rounded-3xl border-2 border-primary/20 bg-white shadow-2xl",
            !open && "hidden",
          )}
        >
          <header className="flex shrink-0 items-start justify-between border-b-2 border-primary/15 bg-oggi-pink-light/60 pb-3 pl-[6.75rem] pr-4 pt-4">
            <div className="min-w-0 pt-1">
              <p id="fest-assistant-title" className="font-heading text-base font-extrabold uppercase text-primary">
                Rudigo
              </p>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Assistente Oggi Fest
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 rounded-full"
              onClick={reset}
              aria-label="Recomeçar conversa"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </header>

          <div ref={scrollRef} className="min-h-[280px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg) =>
              msg.role === "bot" ? (
                <div key={msg.id} className="flex items-end gap-2">
                  <RudigoAvatar size={32} className="mb-0.5" />
                  <div className="max-w-[calc(88%-2.5rem)] rounded-2xl rounded-bl-md bg-oggi-pink-light/80 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div
                  key={msg.id}
                  className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground"
                >
                  {msg.text}
                </div>
              ),
            )}
          </div>

          <footer className="shrink-0 border-t border-primary/10 bg-white p-3">
            {step === "done" ? (
              <div className="flex flex-col gap-2">
                <Link
                  href={summaryHref}
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants(), "w-full rounded-full")}
                >
                  Ver pedido montado
                </Link>
                <Link
                  href="/carrinho"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
                >
                  Ir ao carrinho
                </Link>
                <Button type="button" variant="ghost" className="w-full rounded-full text-xs" onClick={reset}>
                  Montar outro pedido
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => onChip(chip.id)}
                    className="rounded-full border-2 border-primary/25 bg-white px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-primary transition hover:border-primary hover:bg-oggi-pink-light/50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </footer>
        </div>
      </div>

      {/* FAB — cores Oggi (rosa, amarelo, pink light) */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-controls="fest-assistant-panel"
        className={cn(
          "group relative flex items-center justify-center gap-2.5 overflow-visible rounded-full transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35",
          open
            ? "h-[4.25rem] w-[4.25rem] bg-gradient-to-br from-primary to-[#b80062] text-primary-foreground shadow-[0_10px_28px_rgba(226,0,122,0.45)] ring-[3px] ring-[#ffc72c]/75 hover:shadow-[0_12px_32px_rgba(226,0,122,0.55)] hover:ring-[#ffc72c] sm:h-auto sm:w-auto sm:px-6 sm:py-3.5"
            : "h-[5.75rem] w-[5.75rem] bg-gradient-to-br from-primary via-primary to-[#b80062] p-[3px] shadow-[0_12px_36px_rgba(226,0,122,0.42)] ring-[3px] ring-[#ffc72c]/80 hover:scale-[1.04] hover:shadow-[0_16px_40px_rgba(226,0,122,0.5)] hover:ring-[#ffc72c] sm:h-auto sm:w-auto sm:rounded-full sm:p-[3px] sm:pr-5",
        )}
        aria-label={open ? "Fechar chat do Rudigo" : "Abrir chat do Rudigo"}
      >
        {!open ? (
          <span
            className="absolute -right-0.5 -top-0.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ffc72c] px-1.5 text-[0.6rem] font-extrabold uppercase tracking-wide text-[#2d2d2d] shadow-sm ring-2 ring-white"
            aria-hidden
          >
            Ajuda
          </span>
        ) : null}

        {open ? (
          <X className="h-7 w-7 sm:h-6 sm:w-6" aria-hidden />
        ) : (
          <>
            <span className="flex h-full w-full items-end justify-center overflow-hidden rounded-full bg-oggi-pink-light ring-2 ring-white/90 sm:hidden">
              <span className="relative h-[4.85rem] w-[4.35rem]">
                <Image
                  src={RUDIGO_MASCOT}
                  alt=""
                  fill
                  className="object-contain object-bottom drop-shadow-[0_4px_8px_rgba(226,0,122,0.25)]"
                  sizes="78px"
                />
              </span>
            </span>
            <span className="hidden items-center gap-2.5 sm:flex">
              <span className="flex h-[4.5rem] w-[4rem] items-end justify-center overflow-hidden rounded-full bg-oggi-pink-light ring-2 ring-white/90">
                <span className="relative h-[4.1rem] w-[3.6rem]">
                  <Image
                    src={RUDIGO_MASCOT}
                    alt=""
                    fill
                    className="object-contain object-bottom drop-shadow-[0_4px_8px_rgba(226,0,122,0.25)]"
                    sizes="72px"
                  />
                </span>
              </span>
              <span className="pr-1 text-left">
                <span className="block font-heading text-sm font-black uppercase leading-tight tracking-wide text-white">
                  Rudigo
                </span>
                <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-white/85">
                  Montar festa
                </span>
              </span>
            </span>
          </>
        )}

        {open ? (
          <span className="hidden font-heading text-sm font-extrabold uppercase tracking-wide text-primary-foreground sm:inline">
            Fechar
          </span>
        ) : null}
      </button>
    </div>
  );
}
