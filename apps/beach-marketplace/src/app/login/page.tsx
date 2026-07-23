"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IceCream, User, Truck, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

type Perfil = "cliente" | "ambulante" | "admin" | null;

// Credenciais mock para demonstração
const MOCK_CREDENTIALS = {
  cliente: { email: "lucas@example.com", senha: "123456" },
  ambulante: { email: "joao@ambulante.com", senha: "123456" },
  admin: { email: "admin@loslos.com", senha: "admin123" },
};

export default function LoginPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function preencherDemo() {
    if (!perfil) return;
    setEmail(MOCK_CREDENTIALS[perfil].email);
    setSenha(MOCK_CREDENTIALS[perfil].senha);
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil) return;
    setErro("");
    setLoading(true);

    // Simula delay de autenticação
    await new Promise((r) => setTimeout(r, 800));

    const cred = MOCK_CREDENTIALS[perfil];
    if (email === cred.email && senha === cred.senha) {
      if (perfil === "cliente") {
        router.push("/cliente/painel");
      } else if (perfil === "ambulante") {
        router.push("/ambulante/painel");
      } else {
        router.push("/admin");
      }
    } else {
      setErro("Email ou senha incorretos. Use as credenciais de demonstração.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-foreground hover:text-loslos-teal transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <IceCream className="text-loslos-teal w-6 h-6" />
            <span className="font-black text-foreground">Los Los na Praia</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🏖️</div>
            <h1 className="text-2xl font-black text-foreground">Bem-vindo!</h1>
            <p className="text-muted-foreground text-sm mt-1">Escolha como deseja entrar</p>
          </div>

          {/* Seleção de perfil */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => { setPerfil("cliente"); setEmail(""); setSenha(""); setErro(""); }}
              className={`rounded-2xl p-4 border-2 text-left transition-all ${
                perfil === "cliente"
                  ? "border-loslos-teal-dark bg-card shadow-md"
                  : "border-transparent bg-secondary hover:bg-card hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                perfil === "cliente" ? "bg-loslos-teal text-white" : "bg-primary/10 text-loslos-teal"
              }`}>
                <User className="w-5 h-5" />
              </div>
              <p className="font-bold text-foreground text-sm">Cliente</p>
              <p className="text-xs text-muted-foreground mt-0.5">Meus pedidos</p>
            </button>

            <button
              onClick={() => { setPerfil("ambulante"); setEmail(""); setSenha(""); setErro(""); }}
              className={`rounded-2xl p-4 border-2 text-left transition-all ${
                perfil === "ambulante"
                  ? "border-loslos-teal-dark bg-card shadow-md"
                  : "border-transparent bg-secondary hover:bg-card hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                perfil === "ambulante" ? "bg-loslos-teal text-white" : "bg-primary/10 text-loslos-teal"
              }`}>
                <Truck className="w-5 h-5" />
              </div>
              <p className="font-bold text-foreground text-sm">Ambulante</p>
              <p className="text-xs text-muted-foreground mt-0.5">Entregas</p>
            </button>

            <button
              onClick={() => { setPerfil("admin"); setEmail(""); setSenha(""); setErro(""); }}
              className={`rounded-2xl p-4 border-2 text-left transition-all ${
                perfil === "admin"
                  ? "border-loslos-teal-dark bg-card shadow-md"
                  : "border-transparent bg-white/5 hover:bg-white/10 hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                perfil === "admin" ? "bg-loslos-teal text-white" : "bg-white/5 text-muted-foreground"
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="font-bold text-muted-foreground text-sm">Admin</p>
              <p className="text-xs text-muted-foreground mt-0.5">Gestão</p>
            </button>
          </div>

          {/* Formulário */}
          {perfil && (
            <div className="bg-card rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground text-sm">
                  {perfil === "cliente" ? "Entrar como Cliente" : perfil === "ambulante" ? "Entrar como Ambulante" : "Entrar como Admin"}
                </p>
                <button
                  type="button"
                  onClick={preencherDemo}
                  className="text-xs text-loslos-teal font-semibold hover:underline"
                >
                  Usar demo
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={MOCK_CREDENTIALS[perfil].email}
                    required
                    className="w-full bg-secondary border border-border text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-loslos-teal focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••"
                      required
                      className="w-full bg-secondary border border-border text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-loslos-teal focus:border-transparent pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {erro && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-loslos-teal-dark text-white font-bold py-3 rounded-xl hover:bg-loslos-teal transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>

              {/* Credenciais de demo */}
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs font-semibold text-foreground mb-1">Credenciais de demonstração:</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {MOCK_CREDENTIALS[perfil].email} / {MOCK_CREDENTIALS[perfil].senha}
                </p>
              </div>
            </div>
          )}

          {!perfil && (
            <p className="text-center text-xs text-muted-foreground">
              Selecione um perfil para continuar
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Quer vender na praia?{" "}
            <Link href="/ambulante/cadastro" className="text-loslos-teal font-semibold hover:underline">
              Cadastre-se como ambulante
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
