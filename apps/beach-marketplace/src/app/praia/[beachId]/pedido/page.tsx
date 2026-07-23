"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBeachById, getAmbulantesbyBeach, getProductById } from "@/lib/beach-marketplace/mock-data";
import { useBeachCart, useGeolocation, useNearestAmbulantes } from "@/hooks/beach-marketplace";
import { BeachCatalog } from "@/components/beach-marketplace/beach-catalog";
import { BeachCart } from "@/components/beach-marketplace/beach-cart";
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

  useEffect(() => {
    getLocation().catch(() => {
      console.log("Usando localização padrão da praia");
    });
  }, [getLocation]);

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

  const handleCheckout = async () => {
    setCheckoutLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const total = cart.items.reduce((sum, item) => {
      const product = getProductById(item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    const ambulanteEscolhido = nearest[0] || ambulantes[0];

    const order: Order = {
      id: `order-${Date.now()}`,
      beachId,
      clienteNome: "Cliente",
      clienteLat: location?.latitude || beach.latitude,
      clienteLon: location?.longitude || beach.longitude,
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
      totalPrice: total,
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
            <p className="text-loslos-teal font-bold mb-6">{lastOrder.ambulante?.nome}</p>
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
                  onCheckout={handleCheckout}
                  checkoutLoading={checkoutLoading}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}