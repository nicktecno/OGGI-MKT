"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBeachById } from "@/lib/beach-marketplace/mock-data";
import { useOrderNotificationSimulation } from "@/hooks/beach-marketplace";
import { OrderConfirmation } from "@/components/beach-marketplace/order-confirmation";
import { Order } from "@/lib/beach-marketplace/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface ConfirmacaoPageProps {
  params: {
    beachId: string;
    orderId: string;
  };
}

export default function ConfirmacaoPage({ params }: ConfirmacaoPageProps) {
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
      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="text-center space-y-4">
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="mb-8">
        <Link href={`/praia/${beachId}/pedido`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Novo Pedido
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-4">Status do Pedido</h1>
        <p className="text-muted-foreground">
          Acompanhe seu pedido em tempo real
        </p>
      </div>

      <OrderConfirmation
        order={order}
        notificationStage={notificationStage as any}
        currentAttempt={currentAttempt}
        ambulante={order.ambulante}
      />

      <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-muted-foreground space-y-1">
        <p><strong>Debug:</strong></p>
        <p>Status do pedido: {order.status}</p>
        <p>Estágio de notificação: {notificationStage || "Aguardando"}</p>
        <p>Tentativa: {currentAttempt}</p>
      </div>
    </main>
  );
}