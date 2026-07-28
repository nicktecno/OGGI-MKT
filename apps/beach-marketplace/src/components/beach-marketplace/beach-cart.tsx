"use client";

import Image from "next/image";
import { getProductById } from "@/lib/beach-marketplace/mock-data";
import { formatBrl } from "@/lib/utils";
import { Trash2, ShoppingCart, IceCream, Minus, Plus, MapPin, AlertCircle, ChevronDown } from "lucide-react";

interface BeachCartItem {
  productId: string;
  quantity: number;
}

interface BeachCartProps {
  items: BeachCartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  checkoutLoading?: boolean;
  locationError?: string | null;
}

export function BeachCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  checkoutLoading = false,
  locationError = null,
}: BeachCartProps) {
  if (items.length === 0) {
    return (
      <div className="loslos-card p-8 text-center border-dashed">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShoppingCart className="w-6 h-6 text-loslos-teal" />
        </div>
        <p className="font-semibold text-foreground">Seu carrinho está vazio</p>
        <p className="text-xs text-muted-foreground mt-1">
          Toque em <span className="font-bold text-loslos-teal">+</span> nos produtos para adicionar
        </p>
      </div>
    );
  }

  const total = items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="loslos-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-loslos-teal" />
          <h3 className="font-black text-foreground">Seu pedido</h3>
          <span className="ml-auto text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {items.map((item) => {
          const product = getProductById(item.productId);
          if (!product) return null;

          const subtotal = product.price * item.quantity;

          return (
            <div
              key={item.productId}
              className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className="w-14 h-14 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-1 overflow-hidden relative">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                    sizes="56px"
                  />
                ) : (
                  <IceCream className="w-6 h-6 text-loslos-teal" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm text-foreground leading-tight">{product.name}</h4>
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    aria-label={`Remover ${product.name}`}
                    className="text-muted-foreground hover:text-red-500 transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatBrl(product.price)} un.
                </p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      aria-label="Diminuir"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/70 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      aria-label="Aumentar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/70 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-loslos-teal">
                    {formatBrl(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Totalizador */}
        <div className="pt-4 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatBrl(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de serviço</span>
            <span className="text-green-500 font-semibold">Grátis</span>
          </div>
          <div className="flex justify-between font-black text-lg pt-2 border-t border-border">
            <span className="text-foreground">Total</span>
            <span className="text-loslos-teal">{formatBrl(total)}</span>
          </div>
        </div>

        {locationError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
            <details className="group">
              <summary className="cursor-pointer font-semibold text-red-500 hover:underline list-none flex items-center gap-1">
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                Como ativar a localização?
              </summary>
              <ol className="mt-2 ml-1 space-y-1 list-decimal list-inside text-red-500/90">
                <li>Toque no ícone de cadeado 🔒 (ou de configurações) na barra de endereço.</li>
                <li>Toque em <span className="font-semibold">&ldquo;Redefinir permissão&rdquo;</span> ou ative a opção <span className="font-semibold">&ldquo;Local&rdquo;</span>.</li>
                <li>Recarregue a página.</li>
                <li>Toque em <span className="font-semibold">&ldquo;Finalizar pedido&rdquo;</span> e permita a localização.</li>
              </ol>
            </details>
          </div>
        )}

        <button
          onClick={onCheckout}
          disabled={checkoutLoading || items.length === 0}
          className="w-full bg-loslos-teal-dark text-white font-black h-12 rounded-xl hover:bg-loslos-teal transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {checkoutLoading ? "Enviando pedido..." : locationError ? "Tentar novamente" : "Finalizar pedido"}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="w-3 h-3 text-loslos-teal" />
          Ao finalizar, você compartilha sua localização com o ambulante.
        </p>
      </div>
    </div>
  );
}
