import Link from "next/link";
import { ArrowLeft, IceCream, MapPin, Users, CheckCircle, Clock, Trash2 } from "lucide-react";
import { MOCK_BEACHES, MOCK_AMBULANTES } from "@/lib/beach-marketplace/mock-data";

const pendingAmbulantes = [
  { id: "pending-001", nome: "Carlos Melo", telefone: "(21) 97777-0001", beachId: "beach-copacabana-001", createdAt: "2026-07-20" },
  { id: "pending-002", nome: "Ana Ferreira", telefone: "(21) 97777-0002", beachId: "beach-ipanema-001", createdAt: "2026-07-21" },
  { id: "pending-003", nome: "Roberto Silva", telefone: "(21) 97777-0003", beachId: "beach-leblon-001", createdAt: "2026-07-22" },
];

export default function AdminPage() {
  const beachById = Object.fromEntries(MOCK_BEACHES.map((b) => [b.id, b]));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <IceCream className="text-loslos-teal" size={22} />
              <span className="font-black text-foreground">Painel Admin</span>
              <span className="text-muted-foreground font-normal">— Los Los na Praia</span>
            </div>
          </div>
          <Link href="/" className="text-sm text-loslos-teal hover:text-loslos-teal-dark font-semibold">
            Ver site →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Praias ativas", value: MOCK_BEACHES.length, color: "text-loslos-teal", bg: "bg-card" },
            { label: "Ambulantes ativos", value: MOCK_AMBULANTES.length, color: "text-green-500", bg: "bg-card" },
            { label: "Aguardando aprovação", value: pendingAmbulantes.length, color: "text-amber-500", bg: "bg-card" },
            { label: "Pedidos hoje", value: 24, color: "text-purple-400", bg: "bg-card" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-border`}>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Aprovações pendentes */}
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                <h2 className="font-bold text-foreground">Aprovações pendentes</h2>
              </div>
              <Link href="/admin/ambulantes" className="text-sm text-loslos-teal font-semibold hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="divide-y divide-border">
              {pendingAmbulantes.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-semibold text-foreground">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.telefone} · {beachById[a.beachId]?.name ?? a.beachId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Solicitado em {a.createdAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 transition">
                      <CheckCircle size={13} /> Aprovar
                    </button>
                    <button className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 transition border border-red-200">
                      <Trash2 size={13} /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Praias */}
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-loslos-teal" />
                <h2 className="font-bold text-foreground">Praias cadastradas</h2>
              </div>
              <Link href="/admin/praias" className="text-sm text-loslos-teal font-semibold hover:underline">
                Gerenciar →
              </Link>
            </div>
            <div className="divide-y divide-border">
              {MOCK_BEACHES.map((beach) => {
                const ambulantesNaPraia = MOCK_AMBULANTES.filter((a) => a.beachId === beach.id);
                return (
                  <div key={beach.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-semibold text-foreground">{beach.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ambulantesNaPraia.length} ambulante{ambulantesNaPraia.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/praias/${beach.id}/qr`}
                        className="text-xs bg-secondary text-primary font-bold px-3 py-1.5 rounded-lg hover:bg-primary/15 transition border border-border"
                      >
                        QR Code
                      </Link>
                      <Link
                        href={`/admin/praias`}
                        className="text-xs bg-secondary text-foreground font-bold px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition border border-border"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ambulantes ativos */}
        <div className="mt-6 bg-card rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-green-500" />
              <h2 className="font-bold text-foreground">Ambulantes ativos</h2>
            </div>
            <Link href="/admin/ambulantes" className="text-sm text-loslos-teal font-semibold hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-left">
                  <th className="px-5 py-3 font-semibold text-muted-foreground">Nome</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground">Praia</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground">Telefone</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="px-5 py-3 font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_AMBULANTES.slice(0, 5).map((a) => (
                  <tr key={a.id} className="hover:bg-secondary transition">
                    <td className="px-5 py-3 font-medium text-foreground">{a.nome}</td>
                    <td className="px-5 py-3 text-muted-foreground">{beachById[a.beachId]?.name ?? a.beachId}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.telefone}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        a.status === "DISPONIVEL"
                          ? "bg-green-100 text-green-700"
                          : a.status === "INDISPONIVEL"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs text-loslos-teal font-semibold hover:underline">Editar</button>
                        <button className="text-xs text-red-500 font-semibold hover:underline">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
