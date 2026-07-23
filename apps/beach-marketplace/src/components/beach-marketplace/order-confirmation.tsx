"use client";

import Image from "next/image";
import { Ambulante, Order } from "@/lib/beach-marketplace/types";
import { formatBrl } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Loader2,
} from "lucide-react";

interface OrderConfirmationProps {
  order: Order;
  notificationStage?: "enviando" | "aguardando" | "aceito" | "rejeitado" | "ninguem_aceitou" | null;
  currentAttempt?: number;
  ambulante?: Ambulante | null;
}

export function OrderConfirmation({
  order,
  notificationStage,
  currentAttempt = 1,
  ambulante,
}: OrderConfirmationProps) {
  const statusConfig = {
    PENDENTE: {
      label: "Aguardando aceitação",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    ACEITO: {
      label: "Aceito",
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    EM_PREPARACAO: {
      label: "Em preparação",
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    PRONTO: {
      label: "Pronto para retirar",
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    CANCELADO: {
      label: "Cancelado",
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    NINGUEM_ACEITOU: {
      label: "Nenhum ambulante aceitou",
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  };

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      {/* Status Principal */}
      <Card className={status.bg}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <StatusIcon className={`w-6 h-6 ${status.color} flex-shrink-0`} />
            <div>
              <h3 className={`font-semibold ${status.color}`}>{status.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">Pedido #{order.id.slice(0, 8)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status de Notificação (Simulada) */}
      {notificationStage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tentativa {currentAttempt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationStage === "enviando" && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Enviando notificação para o ambulante mais próximo...
                </AlertDescription>
              </Alert>
            )}

            {notificationStage === "aguardando" && (
              <Alert>
                <Clock className="h-4 w-4 animate-pulse" />
                <AlertDescription>
                  Aguardando resposta do ambulante ({currentAttempt}º tentativa)
                </AlertDescription>
              </Alert>
            )}

            {notificationStage === "aceito" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Pedido aceito! O ambulante está preparando seu pedido.
                </AlertDescription>
              </Alert>
            )}

            {notificationStage === "rejeitado" && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Este ambulante rejeitou. Tentando o próximo...
                </AlertDescription>
              </Alert>
            )}

            {notificationStage === "ninguem_aceitou" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Infelizmente nenhum ambulante disponível aceitou o pedido. Tente novamente mais
                  tarde.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ambulante Aceito */}
      {order.status === "ACEITO" && ambulante && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seu Ambulante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                  src={ambulante.fotoPerfil || "https://i.pravatar.cc/150?img=99"}
                  alt={ambulante.nome}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <h4 className="font-semibold">{ambulante.nome}</h4>
                <Badge variant="outline" className="mt-2 text-xs">
                  {ambulante.notificacoesAceitadasCount} pedidos aceitos
                </Badge>

                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{ambulante.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {ambulante.latitude.toFixed(4)}, {ambulante.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapa simplificado (será real em Fase 2) */}
            <div className="bg-secondary border border-border rounded-xl h-32 flex items-center justify-center text-sm text-muted-foreground">
              🗺️ Mapa em tempo real (em breve)
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seus Itens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.productName}
              </span>
              <span className="font-semibold">{formatBrl(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-loslos-teal">{formatBrl(order.totalPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
