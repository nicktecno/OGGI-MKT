"use client";

import Image from "next/image";
import { MOCK_PRODUCTS } from "@/lib/beach-marketplace/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
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
          sorvete: "Sorvetes",
          picolé: "Picolés",
          bebida: "Bebidas",
          outros: "Outros",
        }[category];

        return (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-4 text-pink-600">{categoryLabel}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-40 bg-gray-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/200x160?text=" +
                          encodeURIComponent(product.name);
                      }}
                    />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-pink-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onAddToCart(product)}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
