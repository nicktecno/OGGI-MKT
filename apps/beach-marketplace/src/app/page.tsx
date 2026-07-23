import Link from "next/link";
import { IceCream, MapPin, QrCode, ShieldCheck, Star, Users } from "lucide-react";
import { MOCK_BEACHES, MOCK_PRODUCTS } from "@/lib/beach-marketplace/mock-data";
import { formatBrl } from "@/lib/utils";

const CATEGORIES = [
  { key: "sorvete", label: "Sorvetes" },
  { key: "picolé", label: "Picolés" },
  { key: "bebida", label: "Bebidas" },
] as const;

export default function HomePage() {
  const productsByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    products: MOCK_PRODUCTS.filter((p) => p.category === cat.key && p.disponivel),
  })).filter((cat) => cat.products.length > 0);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IceCream className="text-loslos-teal" size={28} />
            <div>
              <span className="font-black text-lg text-foreground tracking-tight">Los Los</span>
              <span className="text-loslos-teal font-bold text-lg"> na Praia</span>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/ambulante/cadastro"
              className="hidden sm:block text-sm font-semibold text-foreground hover:text-loslos-teal transition"
            >
              Seja um ambulante
            </Link>
            <Link
              href="/login"
              className="text-sm bg-loslos-teal-dark text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-loslos-teal transition"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-loslos-teal-dark via-loslos-teal to-loslos-teal-dark text-white py-20 px-4">
        {/* Foto da praia ao fundo */}
        <img
          src="https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1600&h=900&fit=crop"
          alt="Praia do Rio de Janeiro"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-loslos-teal-dark/60 via-loslos-teal/40 to-loslos-teal-dark/80" />

        {/* Elementos decorativos */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-loslos-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute top-10 right-10 text-6xl opacity-20 rotate-12 select-none">🍦</div>
        <div className="pointer-events-none absolute bottom-8 left-8 text-5xl opacity-20 -rotate-12 select-none">🧊</div>

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/25 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            <QrCode size={15} /> Escaneou, pediu, chegou
          </span>

          <h1 className="text-5xl md:text-6xl font-black mb-5 leading-[1.05] tracking-tight drop-shadow-sm">
            Sorvete Los Los
            <br />
            <span className="text-loslos-yellow">com o pé na areia</span>
          </h1>

          <p className="text-loslos-teal-light text-lg md:text-xl mb-9 max-w-xl mx-auto leading-relaxed">
            Escaneie o QR code na praia e receba seu sorvete favorito{" "}
            <span className="font-semibold text-white">sem sair do lugar.</span>
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="#praias"
              className="group inline-flex items-center gap-2 bg-white text-loslos-teal-dark font-black px-8 py-4 rounded-2xl shadow-xl shadow-black/20 hover:scale-105 hover:shadow-2xl transition-all"
            >
              <MapPin size={20} className="group-hover:animate-bounce" />
              Ver praias disponíveis
            </Link>
            <Link
              href="#catalogo"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white font-bold px-8 py-4 rounded-2xl border border-white/40 hover:bg-white/20 transition-all"
            >
              <IceCream size={20} />
              Ver catálogo
            </Link>
          </div>

          {/* Selos de confiança */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-loslos-teal-light">
            <span className="flex items-center gap-1.5"><Star size={15} className="fill-loslos-yellow text-loslos-yellow" /> Entrega rápida</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Ambulantes verificados</span>
            <span className="flex items-center gap-1.5"><IceCream size={15} /> Sorvetes Los Los</span>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-14 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-center text-foreground mb-10">Como funciona?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <QrCode size={36} className="text-loslos-teal" />,
                title: "Escaneie o QR",
                desc: "Encontre o QR code fixado nos postes ou guarda-sóis da praia.",
              },
              {
                icon: <IceCream size={36} className="text-loslos-teal" />,
                title: "Escolha o sorvete",
                desc: "Veja o catálogo completo e monte seu pedido direto pelo celular.",
              },
              {
                icon: <MapPin size={36} className="text-loslos-teal" />,
                title: "Receba na areia",
                desc: "O ambulante mais próximo recebe o pedido e te encontra na praia.",
              },
            ].map((step) => (
              <div key={step.title} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Praias disponíveis */}
      <section id="praias" className="py-14 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-foreground mb-2">Praias disponíveis</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Clique na praia para ver o catálogo e fazer seu pedido.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {MOCK_BEACHES.map((beach) => (
              <Link
                key={beach.id}
                href={`/praia/${beach.id}`}
                className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="h-32 bg-gradient-to-br from-loslos-teal to-loslos-teal-dark flex items-center justify-center overflow-hidden">
                  {beach.imageUrl ? (
                    <img src={beach.imageUrl} alt={beach.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">🏖️</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-loslos-teal" />
                    <h3 className="font-bold text-foreground group-hover:text-loslos-teal transition">
                      {beach.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs mb-3">{beach.description}</p>
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-lg">
                    Ver pedidos →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="py-14 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-foreground mb-2">Nosso catálogo</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Conheça os produtos que nossos ambulantes levam para a praia.
          </p>
          {productsByCategory.map((cat) => (
            <div key={cat.key} className="mb-10">
              <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">
                {cat.label}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cat.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-card rounded-xl p-4 border border-border"
                  >
                    <div className="h-32 bg-white rounded-lg flex items-center justify-center mb-3 overflow-hidden p-2">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <IceCream size={32} className="text-loslos-teal" />
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">{product.name}</h4>
                    <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{product.description}</p>
                    <p className="font-bold text-foreground">{formatBrl(product.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Ambulante */}
      <section className="py-16 px-4 bg-gradient-to-br from-loslos-teal to-loslos-teal-dark text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Users size={48} className="mx-auto mb-4 text-loslos-teal-light" />
          <h2 className="text-3xl font-black mb-4">Seja um ambulante Los Los</h2>
          <p className="text-loslos-teal-light text-lg mb-3">
            Venda sorvetes nas praias do Rio de Janeiro com suporte total da Los Los.
          </p>
          <ul className="flex flex-wrap justify-center gap-4 text-sm text-loslos-teal-light mb-8">
            <li className="flex items-center gap-1"><ShieldCheck size={16} /> Aprovação rápida</li>
            <li className="flex items-center gap-1"><Star size={16} /> Treinamento incluso</li>
            <li className="flex items-center gap-1"><IceCream size={16} /> Produtos Los Los</li>
          </ul>
          <Link
            href="/ambulante/cadastro"
            className="inline-block bg-white text-loslos-teal-dark font-black text-lg px-8 py-4 rounded-2xl hover:bg-loslos-teal-light transition shadow-lg"
          >
            Quero ser ambulante →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-loslos-teal-dark text-loslos-teal-light text-center py-6 text-sm">
        <p>© {new Date().getFullYear()} Los Los na Praia — Sorvetes Los Los</p>
      </footer>
    </main>
  );
}
