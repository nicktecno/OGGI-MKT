"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBeachById, getAmbulantesbyBeach, getProductById } from "@/lib/beach-marketplace/mock-data";
import { useBeachCart, useGeolocation, useNearestAmbulantes } from "@/hooks/beach-marketplace";
import { BeachCatalog } from "@/components/beach-marketplace/beach-catalog";
import { BeachCart } from "@/components/beach-marketplace/beach-cart";
import { Button } from "@/components/ui/button";
import { BeachProduct, Order } from "@/lib/beach-marketplace/types";
import { ChevronLeft } from "lucide-react";

interface PedidoPageProps {
  params: {
    beachId: string;
  };
}

export default function PedidoPage({ params }: PedidoPageProps) {
  const { beachId } = params;
  const beach = getBeachById(beachId);
  const ambulantes = getAmbulantesbyBeach(beachId);

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
      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Praia não encontrada</h1>
          <Link href="/praia">
            <Button variant="outline">← Voltar</Button>
          </Link>
        </div>
      </main>
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

    setLastOrder(order);
    setCheckoutLoading(false);
  };

  if (lastOrder) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="space-y-6">
          <Link href={`/praia/${beachId}/pedido`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </Link>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-green-700 mb-2">✓ Pedido Criado!</h2>
            <p className="text-green-600 mb-4">
              Pedido #{lastOrder.id.slice(0, 8)} enviado para {lastOrder.ambulante?.nome}
            </p>
            <Link href={`/praia/${beachId}/confirmacao/${lastOrder.id}`}>
              <Button className="bg-green-600 hover:bg-green-700">
                Ver Status do Pedido
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="mb-8">
        <Link href="/praia">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Trocar Praia
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-4">{beach.name}</h1>
        <p className="text-muted-foreground">{beach.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <BeachCatalog onAddToCart={handleAddToCart} />
        </div>

        <div className="lg:col-span-1">
          <BeachCart
            items={cart.items}
            onUpdateQuantity={cart.updateQuantity}
            onRemoveItem={cart.removeItem}
            onCheckout={handleCheckout}
            checkoutLoading={checkoutLoading}
          />
        </div>
      </div>
    </main>
  );
}