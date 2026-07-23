"use client";

import { MOCK_PRODUCTS } from "@/lib/beach-marketplace/mock-data";
import { formatBrl } from "@/lib/utils";
import Image from "next/image";
import { IceCream, Plus } from "lucide-react";
import { BeachProduct } from "@/lib/beach-marketplace/types";

interface BeachCatalogProps {
  onAddToCart: (product: BeachProduct) => void;
}

export function BeachCatalog({ onAddToCart }: BeachCatalogProps) {
  const categories: Array<BeachProduct["category"]> = [
    "sorvete",
    "picolé",
    "bebida",
    "outros",
  ];

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const products = MOCK_PRODUCTS.filter(
          (p) => p.category === category && p.disponivel
        );

        if (products.length === 0) return null;

        const categoryLabel = {
          sorvete: "🍦 Sorvetes",
          picolé: "🧊 Picolés",
          bebida: "🥤 Bebidas",
          outros: "✨ Outros",
        }[category];

        return (
          <div key={category}>
            <h2 className="text-lg font-bold mb-4 text-foreground">{categoryLabel}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  <div className="relative h-28 bg-white flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      <IceCream size={30} className="text-loslos-teal" />
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-bold text-loslos-teal">
                        {formatBrl(product.price)}
                      </span>
                      <button
                        onClick={() => onAddToCart(product)}
                        aria-label={`Adicionar ${product.name}`}
                        className="w-8 h-8 flex items-center justify-center bg-loslos-teal-dark text-white rounded-lg hover:bg-loslos-teal transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
