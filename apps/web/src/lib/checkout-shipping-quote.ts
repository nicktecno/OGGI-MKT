import type { DemoCommerceState } from "./commerce-cookies";

/** Volume em cm³ — alinhado a `package-shipping.util` na API. */
function volumeCm3(alturaCm: number, larguraCm: number, comprimentoCm: number): number {
  return Math.max(0, alturaCm) * Math.max(0, larguraCm) * Math.max(0, comprimentoCm);
}

/**
 * Estimativa de frete (CEP origem → destino, volume e peso).
 * Mantém a mesma fórmula que `stubFreteB2B` na API Nest.
 */
export function stubFretePacote(params: {
  cepOrigem: string;
  cepDestino: string;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  pesoKg: number;
}): number {
  const vol = volumeCm3(params.alturaCm, params.larguraCm, params.comprimentoCm);
  const o = parseInt(params.cepOrigem.replace(/\D/g, "").slice(0, 5), 10) || 10000;
  const d = parseInt(params.cepDestino.replace(/\D/g, "").slice(0, 5), 10) || 10000;
  const dist = Math.abs(o - d) / 1000;
  const base = 14.9 + dist * 8.5 + (vol / 8000) * 3.2 + params.pesoKg * 7.4;
  return Math.round(Math.max(0, base) * 100) / 100;
}

export type CheckoutShippingQuoteLineResult = { listing_id: string; frete_brl: number };

/** Cota frete no modo cookie/demo (mesma regra que a API). */
export function quoteCheckoutShippingFromState(
  state: DemoCommerceState,
  lines: { listing_id: string; quantity: number }[],
  cepDestinoRaw: string,
): { total_frete_brl: number; lines: CheckoutShippingQuoteLineResult[] } {
  const cepDest = cepDestinoRaw.replace(/\D/g, "").slice(0, 8);
  if (cepDest.length !== 8) {
    throw new Error("CEP de destino inválido.");
  }
  let total = 0;
  const out: CheckoutShippingQuoteLineResult[] = [];
  for (const row of lines) {
    const listingId = String(row.listing_id ?? "").trim();
    const q = row.quantity;
    if (!listingId || !Number.isInteger(q) || q < 1 || q > 99) {
      throw new Error("Linha de carrinho inválida.");
    }
    const assignment = state.productionAssignments.find((a) => a.id === listingId);
    if (!assignment || assignment.status !== "PUBLISHED") {
      throw new Error("Oferta não disponível para cotação.");
    }
    const product = state.products.find((p) => p.id === assignment.compositeProductId);
    if (!product || !product.ativo || product.admin_pausado) {
      throw new Error("Produto não disponível para cotação.");
    }
    const cepOrig = assignment.cep_origem.replace(/\D/g, "").slice(0, 8) || "01001000";
    const frete = stubFretePacote({
      cepOrigem: cepOrig,
      cepDestino: cepDest,
      alturaCm: product.pacote_altura_cm,
      larguraCm: product.pacote_largura_cm,
      comprimentoCm: product.pacote_comprimento_cm,
      pesoKg: Math.max(0.01, product.pacote_peso_kg) * q,
    });
    total += frete;
    out.push({ listing_id: listingId, frete_brl: frete });
  }
  return { total_frete_brl: Math.round(total * 100) / 100, lines: out };
}
