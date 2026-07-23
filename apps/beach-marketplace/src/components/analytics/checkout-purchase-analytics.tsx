"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/analytics";

type Props = {
  paid: boolean;
  transactionId: string;
  /** Valor em BRL (não centavos). */
  valueBrl: number | null;
};

export function CheckoutPurchaseAnalytics({ paid, transactionId, valueBrl }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (!paid || !transactionId || sent.current) return;
    try {
      const key = `ga4_purchase_${transactionId}`;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
    sent.current = true;
    const value =
      valueBrl != null && Number.isFinite(valueBrl) && valueBrl > 0 ? valueBrl : 0;
    trackPurchase({
      transaction_id: transactionId,
      value,
      currency: "BRL",
    });
  }, [paid, transactionId, valueBrl]);

  return null;
}
