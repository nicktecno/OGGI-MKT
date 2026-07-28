"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IceCream,
  MapPin,
  Plus,
  Trash2,
  Users,
  LogOut,
  Store,
} from "lucide-react";
import {
  MOCK_DISTRIBUIDORES,
  MOCK_PONTOS_REFERENCIA,
  getBeachById,
  getAmbulantesByDistribuidor,
} from "@/lib/beach-marketplace/mock-data";
import { PontoReferencia } from "@/lib/beach-marketplace/types";

// Distribuidor logado (mock)
const DISTRIBUIDOR_LOGADO = MOCK_DISTRIBUIDORES[0];

export default function DistribuidorPainelPage() {
  const [pontos, setPontos] = useState<PontoReferencia[]>(
    MOCK_PONTOS_REFERENCIA.filter((p) => p.distribuidorId === DISTRIBUIDOR_LOGADO.id)
  );
  const [beachId, setBeachId] = useState(DISTRIBUIDOR_LOGADO.beachIds[0]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const ambulantes = getAmbulantesByDistribuidor(DISTRIBUIDOR_LOGADO.id);

  function addPonto(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const novo: PontoReferencia = {
      id: `ref-${Date.now()}`,
      beachId,
      distribuidorId: DISTRIBUIDOR_LOGADO.id,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setPontos((prev) => [...prev, novo]);
    setNome("");
    setDescricao("");
  }

  function removePonto(id: string) {
    setPontos((prev) => prev.filter((p) => p.id !== id));
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IceCream className="w-6 h-6 text-loslos-teal" />
            <span className="font-bold text-foreground text-lg">Los Los</span>
            <span className="text-muted-foreground text-sm">/ Distribuidor</span>
          </div>
          <Link href="/login" className="text-muted-foreground hover:text-foreground transition">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Card do distribuidor */}
        <div className="bg-card rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-loslos-teal" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{DISTRIBUIDOR_LOGADO.nome}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {DISTRIBUIDOR_LOGADO.beachIds
                    .map((id) => getBeachById(id)?.name ?? id)
                    .join(", ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cadastrar ponto de referência */}
        <form onSubmit={addPonto} className="bg-card rounded-xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-loslos-teal" />
            <p className="font-semibold text-foreground">Adicionar ponto de referência</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Os pontos cadastrados ficam disponíveis para o cliente escolher no lugar da localização.
          </p>

          {DISTRIBUIDOR_LOGADO.beachIds.length > 1 && (
            <select
              className={inputClass}
              value={beachId}
              onChange={(e) => setBeachId(e.target.value)}
            >
              {DISTRIBUIDOR_LOGADO.beachIds.map((id) => (
                <option key={id} value={id}>
                  {getBeachById(id)?.name ?? id}
                </option>
              ))}
            </select>
          )}

          <input
            className={inputClass}
            placeholder="Nome do ponto (ex: Cadeira 42, Quiosque do João)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Descrição (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <button
            type="submit"
            disabled={!nome.trim()}
            className="w-full flex items-center justify-center gap-1.5 bg-loslos-teal-dark text-white font-bold h-11 rounded-xl hover:bg-loslos-teal transition disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            Adicionar ponto
          </button>
        </form>

        {/* Lista de pontos */}
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="font-semibold text-foreground">
              Pontos de referência ({pontos.length})
            </p>
          </div>
          {pontos.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum ponto cadastrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pontos.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{p.nome}</p>
                    {p.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5">{p.descricao}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {getBeachById(p.beachId)?.name ?? p.beachId}
                    </p>
                  </div>
                  <button
                    onClick={() => removePonto(p.id)}
                    className="text-muted-foreground hover:text-red-500 transition flex-shrink-0"
                    aria-label={`Remover ${p.nome}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ambulantes vinculados */}
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-loslos-teal" />
            <p className="font-semibold text-foreground">
              Ambulantes vinculados ({ambulantes.length})
            </p>
          </div>
          <div className="divide-y divide-border">
            {ambulantes.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                  <Image
                    src={a.fotoPerfil ?? "/loslos/logo-white.png"}
                    alt={a.nome}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{a.telefone}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    a.status === "DISPONIVEL"
                      ? "bg-green-100 text-green-700"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {a.status === "DISPONIVEL" ? "Disponível" : "Indisponível"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
