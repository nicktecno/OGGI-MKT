"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBeachById, getAmbulantesbyBeach } from "@/lib/beach-marketplace/mock-data";
import { AmbulanteDashboard } from "@/components/beach-marketplace/ambulante-dashboard";
import { Order } from "@/lib/beach-marketplace/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface AmbullantePageProps {
  params: {
    beachId: string;
  };
}

export default function AmbulantePage({ params }: AmbullantePageProps) {
  const { beachId } = params;
  const beach = getBeachById(beachId);
  const ambulantes = getAmbulantesbyBeach(beachId);

  const ambulante = ambulantes[0];
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fakeOrders: Order[] = [
      {
        id: `order-${Date.now()}-1`,
        beachId,
        clienteNome: "Bernardo",
        clienteLat: -22.986,
        clienteLon: -43.182,
        clientePhone: "(21) 99999-0001",
        items: [
          {
            id: "prod-1",
            productName: "Sorvete Morango",
            quantity: 2,
            price: 8.9,
          },
          {
            id: "prod-2",
            productName: "Picolé Limão",
            quantity: 1,
            price: 5.9,
          },
        ],
        status: "PENDENTE",
        rejectionCount: 0,
        ambulanteAttempts: [],
        totalPrice: 23.7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setPendingOrders(fakeOrders);
  }, [beachId]);

  const handleAcceptOrder = async (orderId: string) => {
    setAcceptingOrderId(orderId);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setPendingOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: "ACEITO" as const } : order
      )
    );

    setAcceptingOrderId(null);

    setTimeout(() => {
      setPendingOrders((prev) => prev.filter((order) => order.id !== orderId));
    }, 2000);
  };

  const handleRejectOrder = (orderId: string) => {
    setPendingOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "CANCELADO" as const,
              rejectionCount: order.rejectionCount + 1,
            }
          : order
      )
    );

    setTimeout(() => {
      setPendingOrders((prev) => prev.filter((order) => order.id !== orderId));
    }, 1000);
  };

  if (!beach || !ambulante) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Não encontrado</h1>
          <Link href="/praia">
            <Button variant="outline">← Voltar</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="mb-8">
        <Link href="/praia">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <AmbulanteDashboard
        ambulante={ambulante}
        pendingOrders={pendingOrders}
        onAcceptOrder={handleAcceptOrder}
        onRejectOrder={handleRejectOrder}
        acceptingOrderId={acceptingOrderId || undefined}
      />
    </main>
  );
}