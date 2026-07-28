"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { IceCream, MapPin, Clock, CheckCircle, Package, RotateCcw, ChevronRight, ShoppingBag, Truck, LogOut, XCircle } from "lucide-react";
import { MOCK_ORDERS, MOCK_PRODUCTS, getBeachById, getAmbullanteById } from "@/lib/beach-marketplace/mock-data";
import { OrderStatus } from "@/lib/beach-marketplace/types";
import { formatBrl } from "@/lib/utils";
import { LiveTrackingMap } from "@/components/beach-marketplace/live-tracking-map";

// Simulando o cliente logado (pedidos de "Lucas Mendes")
const CLIENTE_NOME = "Lucas Mendes";

function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDENTE: "Buscando ambulante...",
    ACEITO: "Ambulante a caminho!",
    EM_PREPARACAO: "Em preparação",
    PRONTO: "Entregue ✓",
    CANCELADO: "Cancelado",
    NINGUEM_ACEITOU: "Não atendido",
  };
  return map[status] ?? status;
}

function statusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDENTE: "bg-yellow-100 text-yellow-700",
    ACEITO: "bg-blue-100 text-blue-700",
    EM_PREPARACAO: "bg-purple-100 text-purple-700",
    PRONTO: "bg-green-100 text-green-700",
    CANCELADO: "bg-red-100 text-red-700",
    NINGUEM_ACEITOU: "bg-gray-100 text-gray-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

function statusIcon(status: OrderStatus) {
  if (status === "PENDENTE") return <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />;
  if (status === "ACEITO" || status === "EM_PREPARACAO") return <Truck className="w-5 h-5 text-blue-600" />;
  if (status === "PRONTO") return <CheckCircle className="w-5 h-5 text-green-600" />;
  return <Package className="w-5 h-5 text-gray-400" />;
}

function statusSteps(status: OrderStatus): number {
  if (status === "PENDENTE") return 1;
  if (status === "ACEITO") return 2;
  if (status === "EM_PREPARACAO") return 3;
  if (status === "PRONTO") return 4;
  return 0;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h atrás`;
}

// Produtos mais pedidos para sugestão de recompra
const FAVORITOS = MOCK_PRODUCTS.slice(0, 4);

export default function PainelClientePage() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const meusOrders = orders.filter((o) => o.clienteNome === CLIENTE_NOME);
  const pedidosAtivos = meusOrders.filter(
    (o) => o.status === "PENDENTE" || o.status === "ACEITO" || o.status === "EM_PREPARACAO"
  );
  const pedidosHistorico = meusOrders.filter(
    (o) => o.status === "PRONTO" || o.status === "CANCELADO" || o.status === "NINGUEM_ACEITOU"
  );

  const totalGasto = pedidosHistorico
    .filter((o) => o.status === "PRONTO")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  function rate(orderId: string, stars: number) {
    setRatings((prev) => ({ ...prev, [orderId]: stars }));
  }

  function cancelarPedido(orderId: string) {
    if (!confirm("Deseja cancelar este pedido?")) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELADO" as const } : o))
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IceCream className="w-6 h-6 text-loslos-teal" />
            <span className="font-bold text-foreground text-lg">Los Los</span>
            <span className="text-muted-foreground text-sm">/ Meus Pedidos</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition">
              <LogOut className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-loslos-teal font-bold text-sm">
                {CLIENTE_NOME.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Saudação */}
        <div className="bg-gradient-to-r from-loslos-teal-dark to-loslos-teal text-white rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Olá,</p>
            <p className="font-bold text-lg">{CLIENTE_NOME.split(" ")[0]} 👋</p>
            <p className="text-sm opacity-80 mt-0.5">
              {totalGasto > 0 ? `${formatBrl(totalGasto)} gastos no total` : "Seu primeiro sorvete?"}
            </p>
          </div>
          <IceCream className="w-12 h-12 opacity-30" />
        </div>

        {/* Pedido ativo em destaque */}
        {pedidosAtivos.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Pedido em andamento
            </p>
            {pedidosAtivos.map((order) => {
              const beach = getBeachById(order.beachId);
              const step = statusSteps(order.status);
              const steps = ["Recebido", "Aceito", "A caminho", "Entregue"];
              const ambulante = order.ambulanteId ? getAmbullanteById(order.ambulanteId) : undefined;
              return (
                <div key={order.id} className="bg-card rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {statusIcon(order.status)}
                        <span className="font-semibold text-foreground">{statusLabel(order.status)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>{timeAgo(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{beach?.name}</span>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="px-4 py-3 bg-secondary">
                    <div className="flex items-center justify-between">
                      {steps.map((label, i) => (
                        <div key={label} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                              i < step
                                ? "bg-loslos-teal-dark text-white"
                                : i === step - 1
                                ? "bg-loslos-teal text-white"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {i < step ? "✓" : i + 1}
                          </div>
                          <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
                          {i < steps.length - 1 && (
                            <div
                              className={`h-0.5 w-full mt-3 -mx-2 ${i < step - 1 ? "bg-loslos-teal-dark" : "bg-border"}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rastreamento em tempo real (mockado) */}
                  {order.status === "ACEITO" && ambulante && (
                    <div className="p-4 border-b border-border">
                      <LiveTrackingMap
                        ambulanteLat={ambulante.latitude}
                        ambulanteLon={ambulante.longitude}
                        clienteLat={order.clienteLat}
                        clienteLon={order.clienteLon}
                        etaMinutos={order.etaMinutos}
                      />
                    </div>
                  )}

                  {/* Itens */}
                  <div className="p-4 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.productImage && (
                          <div className="relative w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                            <Image src={item.productImage} alt={item.productName} fill className="object-contain p-1" sizes="40px" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity}x {formatBrl(item.price)}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatBrl(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-bold text-loslos-teal">{formatBrl(order.totalPrice)}</span>
                    </div>
                  </div>

                  {(order.status === "PENDENTE" || order.status === "ACEITO") && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => cancelarPedido(order.id)}
                        className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar pedido
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Botão novo pedido */}
        <Link
          href="/"
          className="flex items-center justify-between bg-loslos-teal-dark text-white rounded-xl p-4 hover:bg-loslos-teal transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-semibold">Fazer novo pedido</span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Link>

        {/* Favoritos */}
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">Pedir de novo</p>
          <div className="grid grid-cols-2 gap-3">
            {FAVORITOS.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-xl shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="relative w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-1" sizes="48px" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-loslos-teal font-bold">{formatBrl(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico */}
        {pedidosHistorico.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Histórico</p>
            <div className="bg-card rounded-xl shadow-sm divide-y divide-border">
              {pedidosHistorico.map((order) => {
                const beach = getBeachById(order.beachId);
                const rating = ratings[order.id] ?? 0;
                return (
                  <div key={order.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{beach?.name}</span>
                          <span>·</span>
                          <span suppressHydrationWarning>{timeAgo(order.createdAt)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatBrl(order.totalPrice)}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>
                          {order.status === "PRONTO" ? "Entregue" : statusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    {/* Avaliação (só para pedidos entregues) */}
                    {order.status === "PRONTO" && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-muted-foreground mr-1">Avaliar:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => rate(order.id, star)}
                            className={`text-base transition-colors ${
                              star <= rating ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-300"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                        {rating > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">Obrigado!</span>
                        )}
                      </div>
                    )}

                    {/* Pedir de novo */}
                    <Link
                      href="/"
                      className="flex items-center gap-1 text-xs text-loslos-teal font-semibold mt-2 hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Pedir de novo
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
