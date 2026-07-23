"use client";

import { useEffect, useRef } from "react";
import { trackViewItem } from "@/lib/analytics";

type Props = {
  listingId: string;
  productName: string;
  price: number;
};

export function ProductViewAnalytics({ listingId, productName, price }: Props) {
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (lastId.current === listingId) return;
    lastId.current = listingId;
    trackViewItem({
      item_id: listingId,
      item_name: productName,
      price,
      quantity: 1,
      value: price,
      currency: "BRL",
    });
  }, [listingId, productName, price]);

  return null;
}
