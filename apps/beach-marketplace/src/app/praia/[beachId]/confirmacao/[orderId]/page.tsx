"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBeachById } from "@/lib/beach-marketplace/mock-data";
import { useOrderNotificationSimulation } from "@/hooks/beach-marketplace";
import { OrderConfirmation } from "@/components/beach-marketplace/order-confirmation";
import { Order } from "@/lib/beach-marketplace/types";
import { ArrowLeft, IceCream, MapPin } from "lucide-react";

export default function ConfirmacaoPage() {
  const params = useParams<{ beachId: string; orderId: string }>();
  const { beachId, orderId } = params;
  const beach = getBeachById(beachId);

  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`order-${orderId}`);
    if (stored) {
      setOrder(JSON.parse(stored));
    } else {
      setOrder({
        id: orderId,
        beachId,
        clienteNome: "Você",
        clienteLat: -22.986,
        clienteLon: -43.182,
        items: [
          {
            id: "prod-sorvete-morango",
            productName: "Sorvete Morango",
            quantity: 2,
            price: 8.9,
          },
        ],
        status: "PENDENTE",
        rejectionCount: 0,
        ambulanteAttempts: [],
        totalPrice: 17.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [orderId, beachId]);

  const { notificationStage, currentAttempt } = useOrderNotificationSimulation(order);

  if (!beach || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header padronizado */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
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
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground">Status do pedido</h1>
          <p className="text-muted-foreground text-sm">Acompanhe seu pedido em tempo real</p>
        </div>

        <OrderConfirmation
          order={order}
          notificationStage={notificationStage as "enviando" | "aguardando" | "aceito" | "rejeitado" | "ninguem_aceitou" | null}
          currentAttempt={currentAttempt}
          ambulante={order.ambulante}
        />

        <div className="mt-8 text-center">
          <Link
            href={`/praia/${beachId}/pedido`}
            className="inline-flex items-center gap-2 text-sm font-bold text-loslos-teal hover:text-loslos-teal-dark transition"
          >
            <ArrowLeft size={16} /> Fazer um novo pedido
          </Link>
        </div>
      </main>
    </div>
  );
}