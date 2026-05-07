"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { trackAddToCart } from "@/lib/analytics";
import { addOrMergeLine } from "@/lib/cart-storage";
import { cn } from "@/lib/utils";

export type AddToCartPayload = {
  listingId: string;
  productSlug: string;
  productName: string;
  unitPrice: number;
  maxQuantity: number;
  executorNome: string;
  imageUrl?: string;
};

type Props = {
  item: AddToCartPayload;
  className?: string;
};

export function AddToCartActions({ item, className }: Props) {
  const router = useRouter();
  const [hint, setHint] = useState<string | null>(null);
  const soldOut = item.maxQuantity < 1;

  function add(qty: number) {
    if (soldOut) return;
    addOrMergeLine({ ...item, quantity: qty });
    trackAddToCart({
      listingId: item.listingId,
      productName: item.productName,
      productSlug: item.productSlug,
      price: item.unitPrice,
      quantity: qty,
    });
    setHint("Adicionado ao carrinho.");
  }

  function buyNow() {
    if (soldOut) return;
    addOrMergeLine({ ...item, quantity: 1 });
    trackAddToCart({
      listingId: item.listingId,
      productName: item.productName,
      productSlug: item.productSlug,
      price: item.unitPrice,
      quantity: 1,
    });
    router.push("/checkout");
  }

  if (soldOut) {
    return (
      <p className={cn("text-sm font-medium text-destructive", className)}>
        Esta oferta está sem estoque no momento.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-3">
        <Button type="button" size="lg" onClick={() => add(1)}>
          Adicionar ao carrinho
        </Button>
        <Button type="button" size="lg" variant="secondary" onClick={buyNow}>
          Comprar agora
        </Button>
        <Link href="/carrinho" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Ver carrinho
        </Link>
      </div>
      {hint ? (
        <p className="text-sm text-muted-foreground" role="status">
          {hint}{" "}
          <Link href="/checkout" className="font-medium text-accent underline-offset-4 hover:underline">
            Ir ao checkout
          </Link>
          {" · "}
          <Link href="/carrinho" className="underline-offset-4 hover:underline">
            Ver itens
          </Link>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No checkout você informa a entrega, vê o frete e conclui com cartão (quando disponível) ou
          com a opção de confirmação sem pagamento para testes — sempre logado como cliente.
        </p>
      )}
    </div>
  );
}
