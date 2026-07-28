"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBeachById, getAmbulantesbyBeach, getProductById, getPontosReferenciaByBeach, getPontoReferenciaById } from "@/lib/beach-marketplace/mock-data";
import { getGeolocationErrorMessage, calculateDistance } from "@/lib/beach-marketplace/geolocation";
import { useBeachCart, useGeolocation, useNearestAmbulantes } from "@/hooks/beach-marketplace";
import { BeachCatalog } from "@/components/beach-marketplace/beach-catalog";
import { BeachCart } from "@/components/beach-marketplace/beach-cart";
import { BeachCheckoutForm, CheckoutData } from "@/components/beach-marketplace/beach-checkout-form";
import { BeachProduct, Order } from "@/lib/beach-marketplace/types";
import { ArrowLeft, IceCream, MapPin, CheckCircle2, Users } from "lucide-react";

export default function PedidoPage() {
  const params = useParams<{ beachId: string }>();
  const beachId = params.beachId;
  const beach = getBeachById(beachId);
  const ambulantes = getAmbulantesbyBeach(beachId).filter((a) => a.status === "DISPONIVEL");

  const cart = useBeachCart();
  const { location, getLocation } = useGeolocation();
  const { nearest } = useNearestAmbulantes(
    location?.latitude || null,
    location?.longitude || null,
    ambulantes
  );

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  const pontos = getPontosReferenciaByBeach(beachId);
  const cartTotal = cart.items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  if (!beach) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black text-foreground">Praia não encontrada</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-loslos-teal-dark text-white font-bold px-4 py-2 rounded-xl hover:bg-loslos-teal transition"
          >
            <ArrowLeft size={18} /> Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = (product: BeachProduct) => {
    cart.addItem(product.id, 1);
  };

  const handleConfirm = async (data: CheckoutData) => {
    setLocationError(null);
    setCheckoutLoading(true);

    let clienteLat: number;
    let clienteLon: number;
    let pontoRefLabel: string | undefined;
    let pontoRefId: string | undefined;

    if (data.usarLocalizacao) {
      // Localização obrigatória quando o cliente opta por compartilhá-la.
      let loc = location;
      if (!loc) {
        try {
          loc = await getLocation();
        } catch (err) {
          setCheckoutLoading(false);
          setLocationError(getGeolocationErrorMessage(err));
          return;
        }
      }
      clienteLat = loc.latitude;
      clienteLon = loc.longitude;
    } else {
      // Cliente escolheu um ponto de referência cadastrado pelo distribuidor.
      const ponto = data.pontoReferenciaId
        ? getPontoReferenciaById(data.pontoReferenciaId)
        : undefined;
      clienteLat = ponto?.latitude ?? beach.latitude;
      clienteLon = ponto?.longitude ?? beach.longitude;
      pontoRefLabel = ponto?.nome;
      pontoRefId = ponto?.id;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const ambulanteEscolhido = nearest[0] || ambulantes[0];
    const distMeters = ambulanteEscolhido
      ? calculateDistance(clienteLat, clienteLon, ambulanteEscolhido.latitude, ambulanteEscolhido.longitude)
      : null;
    const etaMinutos =
      distMeters != null
        ? Math.min(20, Math.max(3, Math.round(distMeters / 70)))
        : 8 + Math.floor(Math.random() * 7);

    const order: Order = {
      id: `order-${Date.now()}`,
      beachId,
      clienteNome: `${data.nome} ${data.sobrenome}`.trim(),
      clienteWhatsapp: data.whatsapp,
      clientePhone: data.whatsapp,
      clienteLat,
      clienteLon,
      items: cart.items.map((item) => {
        const product = getProductById(item.productId);
        return {
          id: item.productId,
          productName: product?.name || "Produto",
          productImage: product?.imageUrl,
          quantity: item.quantity,
          price: product?.price || 0,
        };
      }),
      ambulante: ambulanteEscolhido,
      ambulanteId: ambulanteEscolhido?.id,
      status: "PENDENTE",
      rejectionCount: 0,
      ambulanteAttempts: [],
      totalPrice: cartTotal,
      pagamento: { metodo: data.metodoPagamento, trocoPara: data.trocoPara },
      pontoReferencia: pontoRefLabel,
      pontoReferenciaId: pontoRefId,
      etaMinutos,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(`order-${order.id}`, JSON.stringify(order));
    setLastOrder(order);
    setCheckoutLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header padronizado */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/praia/${beachId}`} className="text-loslos-teal hover:text-loslos-teal-dark transition">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <IceCream className="text-loslos-teal" size={22} />
              <div>
                <p className="font-black text-foreground leading-none">Los Los na Praia</p>
                <p className="text-xs text-loslos-teal flex items-center gap-1">
                  <MapPin size={11} /> {beach.name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            <Users size={13} />
            {ambulantes.length} disponíve{ambulantes.length !== 1 ? "is" : "l"}
          </div>
        </div>
      </header>

      {lastOrder ? (
        /* Sucesso */
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="loslos-card p-8 text-center">
            <div className="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-loslos-teal" size={36} />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Pedido enviado!</h2>
            <p className="text-muted-foreground mb-1">
              Pedido <span className="font-bold text-foreground">#{lastOrder.id.slice(-6)}</span> enviado para
            </p>
            <p className="text-loslos-teal font-bold mb-2">{lastOrder.ambulante?.nome}</p>
            {lastOrder.etaMinutos != null && (
              <p className="text-sm text-muted-foreground mb-2">
                Chega em aproximadamente{" "}
                <span className="font-bold text-foreground">{lastOrder.etaMinutos} min</span>
              </p>
            )}
            {lastOrder.pontoReferencia && (
              <p className="text-sm text-muted-foreground mb-6">
                Ponto de referência: <span className="font-semibold text-foreground">{lastOrder.pontoReferencia}</span>
              </p>
            )}
            {!lastOrder.pontoReferencia && <div className="mb-6" />}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/praia/${beachId}/confirmacao/${lastOrder.id}`}
                className="bg-loslos-teal-dark text-white font-bold px-6 py-3 rounded-xl hover:bg-loslos-teal transition"
              >
                Acompanhar pedido
              </Link>
              <button
                onClick={() => {
                  cart.clear();
                  setLastOrder(null);
                }}
                className="bg-secondary text-foreground font-bold px-6 py-3 rounded-xl border border-border hover:bg-secondary/70 transition"
              >
                Fazer novo pedido
              </button>
            </div>
          </div>
        </div>
      ) : step === "checkout" ? (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <BeachCheckoutForm
            pontosReferencia={pontos}
            total={cartTotal}
            onBack={() => setStep("cart")}
            onConfirm={handleConfirm}
            submitting={checkoutLoading}
            locationError={locationError}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-foreground">Monte seu pedido</h1>
            <p className="text-muted-foreground text-sm">{beach.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <BeachCatalog onAddToCart={handleAddToCart} />
            </div>

            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <BeachCart
                  items={cart.items}
                  onUpdateQuantity={cart.updateQuantity}
                  onRemoveItem={cart.removeItem}
                  onCheckout={() => {
                    setLocationError(null);
                    setStep("checkout");
                  }}
                  checkoutLoading={false}
                  locationError={null}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}