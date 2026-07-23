"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, IceCream } from "lucide-react";
import { MOCK_BEACHES } from "@/lib/beach-marketplace/mock-data";

export default function AmbulantesCadastroPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    beachId: "",
    mensagem: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simula envio — em produção chamará a API
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow p-8 max-w-md w-full text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-foreground mb-2">Cadastro enviado!</h1>
          <p className="text-muted-foreground mb-6">
            Recebemos sua solicitação. Nossa equipe vai analisar seus dados e entrar em
            contato em até 2 dias úteis para aprovação.
          </p>
          <Link
            href="/"
            className="inline-block bg-loslos-teal-dark text-white font-bold px-6 py-3 rounded-xl hover:bg-loslos-teal-dark/80 transition"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-loslos-teal hover:text-loslos-teal-dark transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <IceCream className="text-loslos-teal" size={22} />
            <span className="font-black text-foreground">Los Los na Praia</span>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground mb-2">Seja um ambulante</h1>
          <p className="text-muted-foreground">
            Preencha o formulário abaixo. Após a análise, nossa equipe entrará em contato
            para aprovação e orientações.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-sm border border-border p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              placeholder="Seu nome completo"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              required
              placeholder="000.000.000-00"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              required
              placeholder="(21) 99999-0000"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="seu@email.com"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Praia desejada <span className="text-red-500">*</span>
            </label>
            <select
              name="beachId"
              value={form.beachId}
              onChange={handleChange}
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal"
            >
              <option value="">Selecione uma praia...</option>
              {MOCK_BEACHES.map((beach) => (
                <option key={beach.id} value={beach.id}>
                  {beach.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              Mensagem (opcional)
            </label>
            <textarea
              name="mensagem"
              value={form.mensagem}
              onChange={handleChange}
              rows={3}
              placeholder="Conte um pouco sobre sua experiência com vendas..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-loslos-teal resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Ao enviar, você concorda com os termos de uso e política de privacidade da Los Los na Praia.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-loslos-teal-dark text-white font-bold py-3 rounded-xl hover:bg-loslos-teal-dark/80 transition disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}
