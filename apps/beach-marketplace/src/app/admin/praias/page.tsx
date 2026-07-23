"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, IceCream, MapPin, Plus, Pencil, Trash2, QrCode, X, Check } from "lucide-react";
import { MOCK_BEACHES } from "@/lib/beach-marketplace/mock-data";
import type { Beach } from "@/lib/beach-marketplace/types";

type BeachForm = Pick<Beach, "name" | "description" | "latitude" | "longitude" | "radius" | "imageUrl">;

const EMPTY_FORM: BeachForm = { name: "", description: "", latitude: 0, longitude: 0, radius: 800, imageUrl: "" };

export default function AdminPraiasPage() {
  const [beaches, setBeaches] = useState<Beach[]>(MOCK_BEACHES);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<BeachForm>(EMPTY_FORM);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(beach: Beach) {
    setForm({ name: beach.name, description: beach.description ?? "", latitude: beach.latitude, longitude: beach.longitude, radius: beach.radius, imageUrl: beach.imageUrl ?? "" });
    setEditing(beach.id);
    setCreating(false);
  }

  function cancelForm() {
    setCreating(false);
    setEditing(null);
  }

  function saveCreate() {
    const newBeach: Beach = {
      id: `beach-${form.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: form.name,
      description: form.description,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius: Number(form.radius),
      imageUrl: form.imageUrl || undefined,
      qrCode: `https://loslospraia.com/praia/beach-${form.name.toLowerCase().replace(/\s+/g, "-")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBeaches((prev) => [...prev, newBeach]);
    setCreating(false);
  }

  function saveEdit() {
    setBeaches((prev) =>
      prev.map((b) =>
        b.id === editing
          ? { ...b, ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), radius: Number(form.radius), updatedAt: new Date().toISOString() }
          : b
      )
    );
    setEditing(null);
  }

  function deleteBeach(id: string) {
    if (confirm("Excluir esta praia?")) setBeaches((prev) => prev.filter((b) => b.id !== id));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft size={20} />
          </Link>
          <IceCream className="text-loslos-teal" size={22} />
          <span className="font-black text-foreground">Gerenciar Praias</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-foreground">Praias cadastradas</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-loslos-teal-dark text-white font-bold px-4 py-2 rounded-xl hover:bg-loslos-teal-dark/80 transition"
          >
            <Plus size={16} /> Nova praia
          </button>
        </div>

        {/* Formulário de criação/edição */}
        {(creating || editing) && (
          <div className="bg-card rounded-2xl border border-border shadow p-6 mb-6">
            <h2 className="font-bold text-foreground mb-4">
              {creating ? "Nova praia" : "Editar praia"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Nome</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Ex: Barra da Tijuca" className="w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-loslos-teal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Descrição</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Descrição curta" className="w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-loslos-teal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Latitude</label>
                <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} placeholder="-23.00000" className="w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-loslos-teal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Longitude</label>
                <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} placeholder="-43.00000" className="w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-loslos-teal" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Raio (metros)</label>
                <input name="radius" type="number" value={form.radius} onChange={handleChange} placeholder="800" className="w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-loslos-teal" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={creating ? saveCreate : saveEdit}
                disabled={!form.name}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2 rounded-xl hover:bg-loslos-teal-dark transition disabled:opacity-50"
              >
                <Check size={16} /> Salvar
              </button>
              <button
                onClick={cancelForm}
                className="flex items-center gap-2 bg-secondary text-foreground font-bold px-5 py-2 rounded-xl hover:bg-secondary/80 transition"
              >
                <X size={16} /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de praias */}
        <div className="space-y-4">
          {beaches.map((beach) => (
            <div key={beach.id} className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-loslos-teal" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{beach.name}</h3>
                    <p className="text-sm text-muted-foreground">{beach.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {beach.latitude}, {beach.longitude} · Raio: {beach.radius}m
                    </p>
                    <p className="text-xs text-loslos-teal mt-1 break-all">{beach.qrCode}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/praias/${beach.id}/qr`}
                    className="flex items-center gap-1 text-xs bg-secondary text-primary font-bold px-3 py-1.5 rounded-lg hover:bg-primary/15 transition border border-border"
                  >
                    <QrCode size={13} /> QR Code
                  </Link>
                  <button
                    onClick={() => openEdit(beach)}
                    className="flex items-center gap-1 text-xs bg-secondary text-foreground font-bold px-3 py-1.5 rounded-lg hover:bg-secondary/80 transition border border-border"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    onClick={() => deleteBeach(beach.id)}
                    className="flex items-center gap-1 text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 transition border border-red-200"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
