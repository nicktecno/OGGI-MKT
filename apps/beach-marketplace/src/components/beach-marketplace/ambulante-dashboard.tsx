"use client";

import Image from "next/image";
import { Ambulante, Order } from "@/lib/beach-marketplace/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OrderLocationMap } from "@/components/beach-marketplace/order-location-map";
import { Bell, Check, X, Clock } from "lucide-react";

interface AmbulanteDashboardProps {
  ambulante: Ambulante;
  pendingOrders: Order[];
  onAcceptOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  acceptingOrderId?: string;
}

export function AmbulanteDashboard({
  ambulante,
  pendingOrders,
  onAcceptOrder,
  onRejectOrder,
  acceptingOrderId,
}: AmbulanteDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Info do Ambulante */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              <Image
                src={ambulante.fotoPerfil || "https://i.pravatar.cc/150?img=99"}
                alt={ambulante.nome}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">{ambulante.nome}</h2>
              <div className="flex gap-2 mt-2">
                <Badge
                  className={
                    ambulante.status === "DISPONIVEL"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {ambulante.status === "DISPONIVEL" ? "🟢 Disponível" : "🔴 Indisponível"}
                </Badge>
                <Badge variant="outline">Estoque: {ambulante.estoque}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{ambulante.telefone}</p>
              <p className="text-sm text-muted-foreground">
                {ambulante.notificacoesAceitadasCount} pedidos aceitos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pedidos Pendentes */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-pink-600" />
          Notificações de Pedido
          {pendingOrders.length > 0 && <Badge className="bg-pink-600">{pendingOrders.length}</Badge>}
        </h3>

        {pendingOrders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-8 pb-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum pedido no momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-pink-600">
                <CardContent className="pt-6">
                  {/* Cabeçalho */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold">Pedido de {order.clienteNome}</h4>
                      <p className="text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)} -{" "}
                        {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                    <Badge className="bg-pink-100 text-pink-800">R$ {order.totalPrice.toFixed(2)}</Badge>
                  </div>

                  {/* Itens */}
                  <div className="bg-gray-50 rounded p-3 mb-4 space-y-1 text-sm">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-semibold">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Cliente Info */}
                  <div className="text-xs text-muted-foreground mb-4 space-y-2">
                    {order.clientePhone && (
                      <div>
                        📞 <span>{order.clientePhone}</span>
                      </div>
                    )}
                    <OrderLocationMap lat={order.clienteLat} lon={order.clienteLon} />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onAcceptOrder(order.id)}
                      disabled={acceptingOrderId === order.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {acceptingOrderId === order.id ? "Processando..." : "Aceitar"}
                    </Button>
                    <Button
                      onClick={() => onRejectOrder(order.id)}
                      disabled={acceptingOrderId === order.id}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>

                  {/* Status de processamento */}
                  {acceptingOrderId === order.id && (
                    <Alert className="mt-3 border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800 text-sm">
                        ⏳ Processando resposta...
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Auxiliar */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>Nota:</strong> Este é um dashboard demo (Fase 1). Em produção (Fase 2), os
          ambulantes terão uma app mobile nativa com notificações push e WebSocket em tempo real.
        </AlertDescription>
      </Alert>
    </div>
  );
}
