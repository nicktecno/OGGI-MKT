"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { IceCream, MapPin, Bell, CheckCircle, XCircle, Clock, Package, User, ChevronRight, AlertCircle, LogOut, Banknote, Phone, Boxes, ShoppingBag, Hourglass } from "lucide-react";
import { MOCK_ORDERS, MOCK_AMBULANTES, MOCK_PRODUCTS, getBeachById, getProductById, getDistribuidorById } from "@/lib/beach-marketplace/mock-data";
import { Order, OrderStatus, OrderItem, PaymentMethod, VendaExterna } from "@/lib/beach-marketplace/types";
import { formatBrl } from "@/lib/utils";
import { OrderLocationMap } from "@/components/beach-marketplace/order-location-map";

const REJECT_REASONS = ["Sem estoque", "Muito longe", "Fim do expediente", "Outro"];

function pagamentoLabel(metodo: PaymentMethod): string {
  return metodo === "PIX" ? "Pix" : metodo === "CARTAO" ? "Cartão" : "Dinheiro";
}

/** Retorna o estoque registrado para um item do pedido, ou null se desconhecido. */
function stockForItem(item: OrderItem, skuStock: Record<string, number>): number | null {
  const byId = getProductById(item.id);
  if (byId) return skuStock[byId.id] ?? 0;
  const byName = MOCK_PRODUCTS.find((p) => p.name === item.productName);
  if (byName) return skuStock[byName.id] ?? 0;
  return null;
}

// Simulando o ambulante logado
const AMBULANTE_LOGADO = MOCK_AMBULANTES[0];

function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDENTE: "Pendente",
    ACEITO: "Aceito",
    EM_PREPARACAO: "Em Preparação",
    AGUARDANDO_CONFIRMACAO: "Aguardando confirmação",
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
    AGUARDANDO_CONFIRMACAO: "bg-amber-100 text-amber-700",
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
  const [skuStock, setSkuStock] = useState<Record<string, number>>(() =>
    Object.fromEntries(MOCK_PRODUCTS.map((p) => [p.id, 6]))
  );
  const [showStock, setShowStock] = useState(false);
  const [showVendaExterna, setShowVendaExterna] = useState(false);
  const [vendaProdutoId, setVendaProdutoId] = useState(MOCK_PRODUCTS[0]?.id ?? "");
  const [vendaQtd, setVendaQtd] = useState(1);
  const [vendaPagamento, setVendaPagamento] = useState<PaymentMethod>("DINHEIRO");
  const [vendasExternas, setVendasExternas] = useState<VendaExterna[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [tab, setTab] = useState<"ativos" | "historico">("ativos");

  const distribuidor = getDistribuidorById(AMBULANTE_LOGADO.distribuidorId);
  const estoqueTotal = Object.values(skuStock).reduce((a, b) => a + b, 0);

  const minhaOrders = orders.filter((o) => o.ambulanteId === AMBULANTE_LOGADO.id);
  const pedidosPendentes = orders.filter((o) => o.status === "PENDENTE" && !o.ambulanteId);
  const pedidosAtivos = minhaOrders.filter(
    (o) => o.status === "ACEITO" || o.status === "EM_PREPARACAO" || o.status === "AGUARDANDO_CONFIRMACAO"
  );
  const pedidosHistorico = minhaOrders.filter((o) => o.status === "PRONTO" || o.status === "CANCELADO");

  const vendaProduto = MOCK_PRODUCTS.find((p) => p.id === vendaProdutoId);
  const estoqueVendaProduto = vendaProduto ? skuStock[vendaProduto.id] ?? 0 : 0;
  const totalVendasExternas = vendasExternas.reduce((sum, v) => sum + v.total, 0);

  const ganhoHoje =
    pedidosHistorico
      .filter((o) => o.status === "PRONTO")
      .reduce((sum, o) => sum + o.totalPrice, 0) + totalVendasExternas;

  function aceitarPedido(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      // Abate o estoque por SKU ao aceitar o pedido.
      setSkuStock((prev) => {
        const next = { ...prev };
        for (const item of order.items) {
          const prod = getProductById(item.id) || MOCK_PRODUCTS.find((p) => p.name === item.productName);
          if (prod) next[prod.id] = Math.max(0, (next[prod.id] ?? 0) - item.quantity);
        }
        return next;
      });
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "ACEITO", ambulanteId: AMBULANTE_LOGADO.id } : o
      )
    );
  }

  function rejeitarPedido(orderId: string, motivo: string) {
    // Ao recusar (com justificativa), o pedido seria redirecionado ao
    // ambulante mais próximo. Aqui (mock) apenas registramos a recusa.
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "CANCELADO", rejectionCount: o.rejectionCount + 1 }
          : o
      )
    );
    setRejectingId(null);
    setRejectReason("");
    void motivo;
  }

  function marcarEntregue(orderId: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "AGUARDANDO_CONFIRMACAO", entregueEm: new Date().toISOString() }
          : o
      )
    );
  }

  /** Dá baixa no estoque de um produto vendido diretamente na praia, sem pedido pelo app. */
  function registrarVendaExterna() {
    if (!vendaProduto || vendaQtd < 1 || vendaQtd > estoqueVendaProduto) return;
    const venda: VendaExterna = {
      id: `venda-${Date.now()}`,
      ambulanteId: AMBULANTE_LOGADO.id,
      productId: vendaProduto.id,
      productName: vendaProduto.name,
      quantidade: vendaQtd,
      precoUnitario: vendaProduto.price,
      total: vendaProduto.price * vendaQtd,
      pagamento: vendaPagamento,
      createdAt: new Date().toISOString(),
    };
    setSkuStock((prev) => ({
      ...prev,
      [vendaProduto.id]: Math.max(0, (prev[vendaProduto.id] ?? 0) - vendaQtd),
    }));
    setVendasExternas((prev) => [venda, ...prev]);
    setVendaQtd(1);
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
            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-border">
              <Image src={AMBULANTE_LOGADO.fotoPerfil ?? "/loslos/logo-white.png"} alt={AMBULANTE_LOGADO.nome} fill className="object-cover" sizes="32px" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Card de perfil + status */}
        <div className="bg-card rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-border">
              <Image src={AMBULANTE_LOGADO.fotoPerfil ?? "/loslos/logo-white.png"} alt={AMBULANTE_LOGADO.nome} fill className="object-cover" sizes="48px" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{AMBULANTE_LOGADO.nome}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{beach?.name ?? "Praia"}</span>
              </div>
              {distribuidor && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Distribuidor: <span className="font-medium text-foreground">{distribuidor.nome}</span>
                </p>
              )}
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
          <button
            onClick={() => setShowStock((v) => !v)}
            className="bg-card rounded-xl shadow-sm p-3 text-center hover:bg-secondary/50 transition"
          >
            <p className="text-2xl font-bold text-loslos-teal">{estoqueTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">Estoque (gerenciar)</p>
          </button>
        </div>

        {/* Venda fora da plataforma */}
        <button
          onClick={() => setShowVendaExterna((v) => !v)}
          className="w-full flex items-center justify-between bg-card rounded-xl shadow-sm p-4 hover:bg-secondary/50 transition"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-loslos-teal" />
            <span className="font-semibold text-foreground text-sm">Venda fora da plataforma</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {vendasExternas.length > 0 ? `${vendasExternas.length} venda(s) · ${formatBrl(totalVendasExternas)}` : "Dar baixa"}
          </span>
        </button>

        {showVendaExterna && (
          <div className="bg-card rounded-xl shadow-sm p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Registre as vendas feitas direto na praia (sem pedido pelo app) para dar baixa no estoque.
            </p>

            <select
              className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal"
              value={vendaProdutoId}
              onChange={(e) => {
                setVendaProdutoId(e.target.value);
                setVendaQtd(1);
              }}
            >
              {MOCK_PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatBrl(p.price)} (estoque: {skuStock[p.id] ?? 0})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantidade</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVendaQtd((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center hover:bg-secondary/70"
                  aria-label="Diminuir quantidade"
                >
                  &minus;
                </button>
                <span className="w-8 text-center font-bold text-foreground">{vendaQtd}</span>
                <button
                  onClick={() => setVendaQtd((q) => Math.min(estoqueVendaProduto, q + 1))}
                  disabled={vendaQtd >= estoqueVendaProduto}
                  className="w-7 h-7 rounded-full bg-primary/10 text-loslos-teal font-bold flex items-center justify-center hover:bg-primary/20 disabled:opacity-40"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              {(["DINHEIRO", "PIX", "CARTAO"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setVendaPagamento(m)}
                  className={`flex-1 text-xs px-2 py-2 rounded-lg border transition ${
                    vendaPagamento === m
                      ? "border-loslos-teal bg-primary/10 text-loslos-teal font-semibold"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {pagamentoLabel(m)}
                </button>
              ))}
            </div>

            <button
              onClick={registrarVendaExterna}
              disabled={estoqueVendaProduto < 1 || vendaQtd > estoqueVendaProduto}
              className="w-full bg-loslos-teal-dark text-white font-bold h-11 rounded-xl hover:bg-loslos-teal transition disabled:opacity-50"
            >
              {estoqueVendaProduto < 1
                ? "Sem estoque"
                : `Dar baixa — ${formatBrl((vendaProduto?.price ?? 0) * vendaQtd)}`}
            </button>

            {vendasExternas.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Vendas registradas hoje</p>
                <div className="max-h-40 overflow-y-auto divide-y divide-border">
                  {vendasExternas.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2 text-sm">
                      <div className="min-w-0">
                        <p className="text-foreground truncate">
                          {v.quantidade}x {v.productName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {pagamentoLabel(v.pagamento)} · <span suppressHydrationWarning>{timeAgo(v.createdAt)}</span>
                        </p>
                      </div>
                      <span className="font-semibold text-loslos-teal">{formatBrl(v.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Início da jornada — estoque por SKU */}
        {showStock && (
          <div className="bg-card rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-loslos-teal" />
              <p className="font-semibold text-foreground">Início da jornada — meu estoque</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Registre a quantidade de cada produto que você levou no carrinho.
            </p>
            <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {MOCK_PRODUCTS.map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-2">
                  <span className="text-sm text-foreground flex-1 truncate">{p.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setSkuStock((s) => ({ ...s, [p.id]: Math.max(0, (s[p.id] ?? 0) - 1) }))
                      }
                      className="w-6 h-6 rounded-full bg-secondary text-foreground text-sm font-bold flex items-center justify-center hover:bg-secondary/70"
                      aria-label={`Diminuir ${p.name}`}
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-foreground">{skuStock[p.id] ?? 0}</span>
                    <button
                      onClick={() => setSkuStock((s) => ({ ...s, [p.id]: (s[p.id] ?? 0) + 1 }))}
                      className="w-6 h-6 rounded-full bg-primary/10 text-loslos-teal text-sm font-bold flex items-center justify-center hover:bg-primary/20"
                      aria-label={`Aumentar ${p.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  {order.items.map((item) => {
                    const stock = stockForItem(item, skuStock);
                    const emEstoque = stock == null || stock >= item.quantity;
                    return (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        {item.productImage && (
                          <div className="relative w-6 h-6 flex-shrink-0">
                            <Image src={item.productImage} alt={item.productName} fill className="object-contain" sizes="24px" />
                          </div>
                        )}
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.productName}
                        </span>
                        <span
                          className={`ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                            emEstoque ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {emEstoque ? "Em estoque" : "Sem estoque"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Dados do cliente e pagamento */}
                <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                  {order.pontoReferencia && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-loslos-teal" />
                      <span>
                        Ponto de referência: <span className="font-semibold text-foreground">{order.pontoReferencia}</span>
                      </span>
                    </div>
                  )}
                  {order.pagamento && (
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-loslos-teal" />
                      <span>
                        Pagamento: <span className="font-semibold text-foreground">{pagamentoLabel(order.pagamento.metodo)}</span>
                        {order.pagamento.metodo === "DINHEIRO" && order.pagamento.trocoPara
                          ? ` (troco p/ ${formatBrl(order.pagamento.trocoPara)})`
                          : ""}
                      </span>
                    </div>
                  )}
                  {order.clienteWhatsapp && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-loslos-teal" />
                      <span>{order.clienteWhatsapp}</span>
                    </div>
                  )}
                </div>

                <OrderLocationMap lat={order.clienteLat} lon={order.clienteLon} />
                {rejectingId === order.id ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                    <p className="text-xs font-semibold text-red-700">Por que está recusando?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {REJECT_REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setRejectReason(r)}
                          className={`text-xs px-2 py-1.5 rounded-lg border transition ${
                            rejectReason === r
                              ? "border-red-500 bg-red-100 text-red-700 font-semibold"
                              : "border-red-200 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        disabled={!rejectReason}
                        onClick={() => rejeitarPedido(order.id, rejectReason)}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Confirmar recusa
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="flex-1 bg-white border border-border text-foreground py-2 rounded-lg text-sm font-semibold hover:bg-secondary transition"
                      >
                        Cancelar
                      </button>
                    </div>
                    <p className="text-[11px] text-red-600/80">
                      O pedido será redirecionado automaticamente ao ambulante mais próximo.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => aceitarPedido(order.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aceitar
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(order.id);
                        setRejectReason("");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Recusar
                    </button>
                  </div>
                )}
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
                              <div className="relative w-5 h-5 flex-shrink-0">
                                <Image src={item.productImage} alt={item.productName} fill className="object-contain" sizes="20px" />
                              </div>
                            )}
                            <span>
                              {item.quantity}x {item.productName}
                            </span>
                          </div>
                        ))}
                      </div>
                      {order.status === "AGUARDANDO_CONFIRMACAO" ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2">
                          <Hourglass className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            Entrega registrada. Aguardando o cliente confirmar o recebimento.
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => marcarEntregue(order.id)}
                          className="w-full bg-loslos-teal-dark text-white py-2 rounded-lg text-sm font-semibold hover:bg-loslos-teal transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como entregue
                        </button>
                      )}
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
                        {order.confirmadoPeloClienteEm && (
                          <p className="text-[11px] text-green-700 mt-0.5 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Recebimento confirmado pelo cliente
                          </p>
                        )}
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
