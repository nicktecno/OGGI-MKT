import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, IceCream, MapPin, Users } from "lucide-react";
import { MOCK_BEACHES, MOCK_AMBULANTES, MOCK_PRODUCTS } from "@/lib/beach-marketplace/mock-data";
import { formatBrl } from "@/lib/utils";

interface Props {
  params: Promise<{ beachId: string }>;
}

const CATEGORIES = [
  { key: "sorvete", label: "🍦 Sorvetes" },
  { key: "picolé", label: "🧊 Picolés" },
  { key: "bebida", label: "🥤 Bebidas" },
] as const;

export default async function BeachLandingPage({ params }: Props) {
  const { beachId } = await params;
  const beach = MOCK_BEACHES.find((b) => b.id === beachId);
  if (!beach) notFound();

  const ambulantes = MOCK_AMBULANTES.filter((a) => a.beachId === beachId && a.status === "DISPONIVEL");
  const availableProducts = MOCK_PRODUCTS.filter((p) => p.disponivel);
  const productsByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    products: availableProducts.filter((p) => p.category === cat.key),
  })).filter((c) => c.products.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-loslos-teal hover:text-loslos-teal-dark transition">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <IceCream className="text-loslos-teal" size={22} />
              <div>
                <p className="font-black text-foreground leading-none">Los Los na Praia</p>
                <p className="text-xs text-loslos-teal">{beach.name}</p>
              </div>
            </div>
          </div>
          <Link
            href={`/praia/${beachId}/pedido`}
            className="bg-loslos-teal-dark text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-loslos-teal-dark/80 transition"
          >
            Fazer pedido
          </Link>
        </div>
      </header>

      {/* Hero da praia */}
      <div className="relative bg-gradient-to-br from-loslos-teal to-loslos-teal-dark text-white py-10 px-4 overflow-hidden">
        {beach.imageUrl && (
          <img src={beach.imageUrl} alt={beach.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-loslos-teal-light text-sm mb-2">
            <MapPin size={14} />
            <span>{beach.description}</span>
          </div>
          <h1 className="text-3xl font-black mb-3">Praia de {beach.name}</h1>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-4 py-2 w-fit">
            <Users size={16} className="text-loslos-teal-light" />
            <span className="text-sm font-semibold">
              {ambulantes.length} ambulante{ambulantes.length !== 1 ? "s" : ""} disponível{ambulantes.length !== 1 ? "is" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Ambulantes na praia */}
        {ambulantes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3">Ambulantes na praia agora</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {ambulantes.map((a) => (
                <div key={a.id} className="flex-shrink-0 bg-card rounded-xl border border-border p-3 flex items-center gap-3 shadow-sm min-w-[180px]">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-loslos-teal font-black text-sm flex-shrink-0">
                    {a.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{a.nome}</p>
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">
                      Disponível
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ambulantes.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center mb-8">
            <p className="text-amber-700 font-bold">Nenhum ambulante disponível nesta praia agora.</p>
            <p className="text-amber-600 text-sm mt-1">Tente novamente em alguns minutos.</p>
          </div>
        )}

        {/* Catálogo */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Cardápio</h2>
            {ambulantes.length > 0 && (
              <Link
                href={`/praia/${beachId}/pedido`}
                className="text-sm text-loslos-teal font-bold hover:text-loslos-teal-dark transition"
              >
                Fazer pedido →
              </Link>
            )}
          </div>

          {productsByCategory.map((cat) => (
            <div key={cat.key} className="mb-8">
              <h3 className="font-bold text-foreground mb-3 text-base">{cat.label}</h3>
              <div className="grid grid-cols-2 gap-3">
                {cat.products.map((product) => (
                  <div key={product.id} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="h-24 bg-white rounded-lg flex items-center justify-center mb-3 overflow-hidden p-2">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <IceCream size={28} className="text-loslos-teal" />
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-loslos-teal">{formatBrl(product.price)}</p>
                      {ambulantes.length > 0 && (
                        <Link
                          href={`/praia/${beachId}/pedido`}
                          className="text-xs bg-loslos-teal-dark text-white font-bold px-3 py-1 rounded-lg hover:bg-loslos-teal-dark/80 transition"
                        >
                          Pedir
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA fazer pedido */}
        {ambulantes.length > 0 && (
          <div className="mt-4 mb-8">
            <Link
              href={`/praia/${beachId}/pedido`}
              className="block w-full bg-loslos-teal-dark text-white font-black text-center py-4 rounded-2xl hover:bg-loslos-teal-dark/80 transition text-lg shadow-lg"
            >
              🛒 Fazer meu pedido
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
