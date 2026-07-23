"use client";

import { useState } from "react";
import Link from "next/link";
import { IceCream, MapPin, Bell, CheckCircle, XCircle, Clock, Package, TrendingUp, User, ChevronRight, AlertCircle, LogOut } from "lucide-react";
import { MOCK_ORDERS, MOCK_AMBULANTES, getBeachById } from "@/lib/beach-marketplace/mock-data";
import { Order, OrderStatus } from "@/lib/beach-marketplace/types";
import { formatBrl } from "@/lib/utils";

// Simulando o ambulante logado
const AMBULANTE_LOGADO = MOCK_AMBULANTES[0];

function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDENTE: "Pendente",
    ACEITO: "Aceito",
    EM_PREPARACAO: "Em Preparação",
    PRONTO: "Entregue",
    CANCELADO: "Cancelado",
    NINGUEM_ACEITOU: "Não Atendido",
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h atrás`;
}

export default function PainelAmbulantePage() {
  const [status, setStatus] = useState<"DISPONIVEL" | "INDISPONIVEL">(
    AMBULANTE_LOGADO.status === "DISPONIVEL" ? "DISPONIVEL" : "INDISPONIVEL"
  );
  const [estoque, setEstoque] = useState(AMBULANTE_LOGADO.estoque);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [tab, setTab] = useState<"ativos" | "historico">("ativos");

  const minhaOrders = orders.filter((o) => o.ambulanteId === AMBULANTE_LOGADO.id);
  const pedidosPendentes = orders.filter((o) => o.status === "PENDENTE" && !o.ambulanteId);
  const pedidosAtivos = minhaOrders.filter((o) => o.status === "ACEITO" || o.status === "EM_PREPARACAO");
  const pedidosHistorico = minhaOrders.filter((o) => o.status === "PRONTO" || o.status === "CANCELADO");

  const ganhoHoje = pedidosHistorico
    .filter((o) => o.status === "PRONTO")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  function aceitarPedido(orderId: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "ACEITO", ambulanteId: AMBULANTE_LOGADO.id } : o
      )
    );
  }

  function rejeitarPedido(orderId: string) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELADO" } : o)));
  }

  function marcarEntregue(orderId: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "PRONTO", entregueEm: new Date().toISOString() }
          : o
      )
    );
  }

  const beach = getBeachById(AMBULANTE_LOGADO.beachId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IceCream className="w-6 h-6 text-loslos-teal" />
            <span className="font-bold text-foreground text-lg">Los Los</span>
            <span className="text-muted-foreground text-sm">/ Ambulante</span>
          </div>
          <div className="flex items-center gap-2">
            {pedidosPendentes.length > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {pedidosPendentes.length}
                </span>
              </div>
            )}
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition">
              <LogOut className="w-5 h-5" />
            </Link>
            <img
              src={AMBULANTE_LOGADO.fotoPerfil}
              alt={AMBULANTE_LOGADO.nome}
              className="w-8 h-8 rounded-full object-cover border-2 border-border"
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Card de perfil + status */}
        <div className="bg-card rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={AMBULANTE_LOGADO.fotoPerfil}
              alt={AMBULANTE_LOGADO.nome}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
            <div>
              <p className="font-semibold text-foreground">{AMBULANTE_LOGADO.nome}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{beach?.name ?? "Praia"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setStatus((s) => (s === "DISPONIVEL" ? "INDISPONIVEL" : "DISPONIVEL"))}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              status === "DISPONIVEL"
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {status === "DISPONIVEL" ? "● Disponível" : "○ Indisponível"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-loslos-teal">{formatBrl(ganhoHoje)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ganhos hoje</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-loslos-teal">{pedidosHistorico.filter((o) => o.status === "PRONTO").length}</p>
            <p className="text-xs text-muted-foreground mt-1">Entregas</p>
          </div>
          <div className="bg-card rounded-xl shadow-sm p-3 text-center relative">
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setEstoque((e) => Math.max(0, e - 1))}
                className="w-6 h-6 rounded-full bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 flex items-center justify-center"
              >
                −
              </button>
              <p className="text-2xl font-bold text-loslos-teal w-10 text-center">{estoque}</p>
              <button
                onClick={() => setEstoque((e) => e + 1)}
                className="w-6 h-6 rounded-full bg-primary/10 text-loslos-teal font-bold text-sm hover:bg-primary/20 flex items-center justify-center"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estoque</p>
          </div>
        </div>

        {/* Novos pedidos */}
        {pedidosPendentes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="font-semibold text-yellow-800">
                {pedidosPendentes.length} novo{pedidosPendentes.length > 1 ? "s" : ""} pedido{pedidosPendentes.length > 1 ? "s" : ""}
              </p>
            </div>
            {pedidosPendentes.map((order) => (
              <div key={order.id} className="bg-card rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{order.clienteNome}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>{timeAgo(order.createdAt)}</p>
                  </div>
                  <p className="font-bold text-loslos-teal">{formatBrl(order.totalPrice)}</p>
                </div>
                <div className="space-y-1 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      {item.productImage && (
                        <img src={item.productImage} alt={item.productName} className="w-6 h-6 object-contain" />
                      )}
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => aceitarPedido(order.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aceitar
                  </button>
                  <button
                    onClick={() => rejeitarPedido(order.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("ativos")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === "ativos"
                  ? "text-loslos-teal-dark border-b-2 border-loslos-teal-dark"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Em andamento
              {pedidosAtivos.length > 0 && (
                <span className="ml-1.5 bg-primary/10 text-loslos-teal text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pedidosAtivos.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("historico")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === "historico"
                  ? "text-loslos-teal-dark border-b-2 border-loslos-teal-dark"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Histórico
            </button>
          </div>

          <div className="divide-y divide-border">
            {tab === "ativos" && (
              <>
                {pedidosAtivos.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhum pedido ativo</p>
                  </div>
                ) : (
                  pedidosAtivos.map((order) => (
                    <div key={order.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{order.clienteNome}</p>
                          <p className="text-xs text-muted-foreground" suppressHydrationWarning>{timeAgo(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-loslos-teal">{formatBrl(order.totalPrice)}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>
                            {statusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 mb-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {item.productImage && (
                              <img src={item.productImage} alt={item.productName} className="w-5 h-5 object-contain" />
                            )}
                            <span>
                              {item.quantity}x {item.productName}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => marcarEntregue(order.id)}
                        className="w-full bg-loslos-teal-dark text-white py-2 rounded-lg text-sm font-semibold hover:bg-loslos-teal transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como entregue
                      </button>
                    </div>
                  ))
                )}
              </>
            )}

            {tab === "historico" && (
              <>
                {pedidosHistorico.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhuma entrega ainda</p>
                  </div>
                ) : (
                  pedidosHistorico.map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{order.clienteNome}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>{timeAgo(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatBrl(order.totalPrice)}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Link para cadastro */}
        <a
          href="/ambulante/cadastro"
          className="flex items-center justify-between bg-card rounded-xl shadow-sm p-4 text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-loslos-teal" />
            <span>Atualizar meus dados</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </a>
      </main>
    </div>
  );
}
