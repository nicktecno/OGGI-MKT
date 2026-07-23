"use client";

import Image from "next/image";
import { getProductById } from "@/lib/beach-marketplace/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingCart } from "lucide-react";

interface BeachCartItem {
  productId: string;
  quantity: number;
}

interface BeachCartProps {
  items: BeachCartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  checkoutLoading?: boolean;
}

export function BeachCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  checkoutLoading = false,
}: BeachCartProps) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-12 pb-12 text-center space-y-3">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Seu carrinho está vazio</p>
          <p className="text-xs text-muted-foreground">
            Adicione itens do catálogo para continuar
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Seu Pedido</CardTitle>
          <CardDescription>Revise seus itens antes de finalizar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;

            const subtotal = product.price * item.quantity;

            return (
              <div
                key={item.productId}
                className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="relative w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/64?text=" +
                        encodeURIComponent(product.name);
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{product.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    R$ {product.price.toFixed(2)} un.
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateQuantity(item.productId, parseInt(e.target.value) || 1)
                      }
                      className="w-12 h-8 text-center text-sm"
                    />
                    <span className="text-sm font-semibold">
                      R$ {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveItem(item.productId)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}

          {/* Totalizador */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de serviço:</span>
              <span>R$ 0,00</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span className="text-pink-600">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={onCheckout}
            disabled={checkoutLoading || items.length === 0}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white h-12"
          >
            {checkoutLoading ? "Processando..." : "Finalizar Pedido"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
