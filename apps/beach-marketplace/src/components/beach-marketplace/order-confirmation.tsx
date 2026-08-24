"use client";

import Image from "next/image";
import { Ambulante, Order, PaymentMethod } from "@/lib/beach-marketplace/types";
import { formatBrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LiveTrackingMap } from "@/components/beach-marketplace/live-tracking-map";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Loader2,
  Banknote,
  PackageCheck,
} from "lucide-react";

function pagamentoLabel(metodo: PaymentMethod): string {
  return metodo === "PIX" ? "Pix" : metodo === "CARTAO" ? "Cartão" : "Dinheiro";
}

interface OrderConfirmationProps {
  order: Order;
  notificationStage?: "enviando" | "aguardando" | "aceito" | "rejeitado" | "ninguem_aceitou" | null;
  currentAttempt?: number;
  ambulante?: Ambulante | null;
  onConfirmarRecebimento?: () => void;
}

export function OrderConfirmation({
  order,
  notificationStage,
  currentAttempt = 1,
  ambulante,
  onConfirmarRecebimento,
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
    AGUARDANDO_CONFIRMACAO: {
      label: "Confirme o recebimento",
      icon: PackageCheck,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    PRONTO: {
      label: "Recebimento confirmado",
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

      {/* Confirmação de recebimento pelo cliente */}
      {onConfirmarRecebimento &&
        (order.status === "ACEITO" ||
          order.status === "EM_PREPARACAO" ||
          order.status === "AGUARDANDO_CONFIRMACAO") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recebeu seu pedido?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {order.status === "AGUARDANDO_CONFIRMACAO"
                  ? "O ambulante registrou a entrega. Confirme o recebimento para concluir o pedido."
                  : "Assim que o ambulante entregar, confirme o recebimento para concluir o pedido."}
              </p>
              <button
                onClick={onConfirmarRecebimento}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
              >
                <PackageCheck className="w-4 h-4" />
                Confirmar recebimento
              </button>
            </CardContent>
          </Card>
        )}

      {order.status === "PRONTO" && order.confirmadoPeloClienteEm && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Recebimento confirmado em{" "}
            <span suppressHydrationWarning>
              {new Date(order.confirmadoPeloClienteEm).toLocaleString("pt-BR")}
            </span>
            .
          </AlertDescription>
        </Alert>
      )}

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

            {/* Rastreamento em tempo real (mockado) */}
            <LiveTrackingMap
              ambulanteLat={ambulante.latitude}
              ambulanteLon={ambulante.longitude}
              clienteLat={order.clienteLat}
              clienteLon={order.clienteLon}
              etaMinutos={order.etaMinutos}
            />
          </CardContent>
        </Card>
      )}

      {/* Detalhes da entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes da entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.etaMinutos != null && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-loslos-teal" />
              <span>
                Entrega em aproximadamente <strong>{order.etaMinutos} min</strong>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-loslos-teal" />
            {order.pontoReferencia ? (
              <span>
                Ponto de referência: <strong>{order.pontoReferencia}</strong>
              </span>
            ) : (
              <span>Localização compartilhada com o ambulante</span>
            )}
          </div>
          {order.pagamento && (
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-loslos-teal" />
              <span>
                Pagamento: <strong>{pagamentoLabel(order.pagamento.metodo)}</strong>
                {order.pagamento.metodo === "DINHEIRO" && order.pagamento.trocoPara
                  ? ` (troco para ${formatBrl(order.pagamento.trocoPara)})`
                  : ""}
              </span>
            </div>
          )}
          {order.clienteWhatsapp && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-loslos-teal" />
              <span>
                WhatsApp: <strong>{order.clienteWhatsapp}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

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
