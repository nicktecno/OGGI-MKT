/** Volume em cm³ (altura × largura × comprimento). */
export function volumeCm3(alturaCm: number, larguraCm: number, comprimentoCm: number): number {
  return Math.max(0, alturaCm) * Math.max(0, larguraCm) * Math.max(0, comprimentoCm);
}

export type PackDims = {
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  pesoKg: number;
};

/**
 * Vários insumos do mesmo fornecedor no mesmo envio: usa o pacote de **maior volume**
 * e o **maior peso** entre os itens (conservador para cotação).
 */
export function pickShipmentPackFromSupplies(items: PackDims[]): PackDims {
  if (items.length === 0) {
    return { alturaCm: 14, larguraCm: 12, comprimentoCm: 5, pesoKg: 0.4 };
  }
  let best = items[0];
  let bestV = volumeCm3(best.alturaCm, best.larguraCm, best.comprimentoCm);
  for (let i = 1; i < items.length; i++) {
    const cur = items[i];
    const v = volumeCm3(cur.alturaCm, cur.larguraCm, cur.comprimentoCm);
    if (v > bestV) {
      bestV = v;
      best = cur;
    }
  }
  const pesoKg = Math.max(...items.map((x) => x.pesoKg));
  return {
    alturaCm: best.alturaCm,
    larguraCm: best.larguraCm,
    comprimentoCm: best.comprimentoCm,
    pesoKg,
  };
}

/**
 * Fallback quando a cotação Melhor Envio não está disponível ou falha (CEP + volume + peso).
 */
export function stubFreteB2B(params: {
  cepOrigem: string;
  cepDestino: string;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  pesoKg: number;
}): number {
  const vol = volumeCm3(params.alturaCm, params.larguraCm, params.comprimentoCm);
  const o = parseInt(params.cepOrigem.replace(/\D/g, '').slice(0, 5), 10) || 10000;
  const d = parseInt(params.cepDestino.replace(/\D/g, '').slice(0, 5), 10) || 10000;
  const dist = Math.abs(o - d) / 1000;
  const base = 14.9 + dist * 8.5 + (vol / 8000) * 3.2 + params.pesoKg * 7.4;
  return Math.round(Math.max(0, base) * 100) / 100;
}
