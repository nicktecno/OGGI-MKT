"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, IceCream, Users, CheckCircle, Trash2, Pencil, X, Check, Clock } from "lucide-react";
import { MOCK_BEACHES, MOCK_AMBULANTES } from "@/lib/beach-marketplace/mock-data";
import type { Ambulante } from "@/lib/beach-marketplace/types";

type TabType = "aprovados" | "pendentes";

const PENDING_AMBULANTES = [
  { id: "pending-001", nome: "Carlos Melo", cpf: "123.456.789-00", telefone: "(21) 97777-0001", email: "carlos@email.com", beachId: "beach-copacabana-001", createdAt: "2026-07-20" },
  { id: "pending-002", nome: "Ana Ferreira", cpf: "987.654.321-00", telefone: "(21) 97777-0002", email: "ana@email.com", beachId: "beach-ipanema-001", createdAt: "2026-07-21" },
  { id: "pending-003", nome: "Roberto Silva", cpf: "111.222.333-44", telefone: "(21) 97777-0003", email: "roberto@email.com", beachId: "beach-leblon-001", createdAt: "2026-07-22" },
];

export default function AdminAmbulantesPage() {
  const [tab, setTab] = useState<TabType>("pendentes");
  const [ambulantes, setAmbulantes] = useState<Ambulante[]>(MOCK_AMBULANTES);
  const [pending, setPending] = useState(PENDING_AMBULANTES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ambulante>>({});

  const beachById = Object.fromEntries(MOCK_BEACHES.map((b) => [b.id, b]));

  function approve(id: string) {
    const person = pending.find((p) => p.id === id);
    if (!person) return;
    const newAmbulante: Ambulante = {
      id: `ambulante-${Date.now()}`,
      beachId: person.beachId,
      nome: person.nome,
      telefone: person.telefone,
      latitude: 0,
      longitude: 0,
      lastLocationAt: new Date().toISOString(),
      status: "DISPONIVEL",
      estoque: 0,
      notificacoesAceitadasCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAmbulantes((prev) => [...prev, newAmbulante]);
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  function reject(id: string) {
    if (confirm("Rejeitar esta solicitação?")) setPending((prev) => prev.filter((p) => p.id !== id));
  }

  function deleteAmbulante(id: string) {
    if (confirm("Excluir este ambulante?")) setAmbulantes((prev) => prev.filter((a) => a.id !== id));
  }

  function startEdit(a: Ambulante) {
    setEditingId(a.id);
    setEditForm({ nome: a.nome, telefone: a.telefone, beachId: a.beachId, status: a.status });
  }

  function saveEdit() {
    setAmbulantes((prev) =>
      prev.map((a) => (a.id === editingId ? { ...a, ...editForm, updatedAt: new Date().toISOString() } : a))
    );
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft size={20} />
          </Link>
          <IceCream className="text-loslos-teal" size={22} />
          <span className="font-black text-foreground">Gerenciar Ambulantes</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setTab("pendentes")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl transition ${tab === "pendentes" ? "bg-card border border-b-card border-border text-amber-500 -mb-px" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Clock size={15} /> Pendentes
            {pending.length > 0 && (
              <span className="bg-amber-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("aprovados")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl transition ${tab === "aprovados" ? "bg-card border border-b-card border-border text-green-500 -mb-px" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users size={15} /> Aprovados ({ambulantes.length})
          </button>
        </div>

        {/* Pendentes */}
        {tab === "pendentes" && (
          <div className="space-y-4">
            {pending.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground">
                <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
                <p className="font-semibold">Nenhuma solicitação pendente!</p>
              </div>
            )}
            {pending.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-foreground">{p.nome}</p>
                    <p className="text-sm text-muted-foreground">CPF: {p.cpf}</p>
                    <p className="text-sm text-muted-foreground">WhatsApp: {p.telefone}</p>
                    <p className="text-sm text-muted-foreground">E-mail: {p.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Praia: <span className="font-semibold text-loslos-teal">{beachById[p.beachId]?.name ?? p.beachId}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Solicitado em {p.createdAt}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => approve(p.id)}
                      className="flex items-center gap-1.5 bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition"
                    >
                      <CheckCircle size={14} /> Aprovar
                    </button>
                    <button
                      onClick={() => reject(p.id)}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition border border-red-200"
                    >
                      <Trash2 size={14} /> Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aprovados */}
        {tab === "aprovados" && (
          <div className="space-y-4">
            {ambulantes.map((a) => (
              <div key={a.id} className="bg-card rounded-2xl border border-border shadow-sm p-5">
                {editingId === a.id ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Nome</label>
                        <input
                          value={editForm.nome ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                          className="w-full bg-secondary border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-loslos-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Telefone</label>
                        <input
                          value={editForm.telefone ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, telefone: e.target.value }))}
                          className="w-full bg-secondary border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-loslos-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Praia</label>
                        <select
                          value={editForm.beachId ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, beachId: e.target.value }))}
                          className="w-full bg-secondary border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-loslos-teal"
                        >
                          {MOCK_BEACHES.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
                        <select
                          value={editForm.status ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Ambulante["status"] }))}
                          className="w-full bg-secondary border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-loslos-teal"
                        >
                          <option value="DISPONIVEL">DISPONIVEL</option>
                          <option value="INDISPONIVEL">INDISPONIVEL</option>
                          <option value="OFFLINE">OFFLINE</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl hover:bg-loslos-teal-dark transition">
                        <Check size={14} /> Salvar
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 bg-secondary text-foreground text-sm font-bold px-4 py-2 rounded-xl hover:bg-secondary/80 transition">
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{a.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.telefone} · {beachById[a.beachId]?.name ?? a.beachId}
                      </p>
                      <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        a.status === "DISPONIVEL" ? "bg-green-100 text-green-700" :
                        a.status === "INDISPONIVEL" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(a)}
                        className="flex items-center gap-1 text-sm bg-secondary text-foreground font-bold px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition border border-border"
                      >
                        <Pencil size={13} /> Editar
                      </button>
                      <button
                        onClick={() => deleteAmbulante(a.id)}
                        className="flex items-center gap-1 text-sm bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 transition border border-red-200"
                      >
                        <Trash2 size={13} /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
