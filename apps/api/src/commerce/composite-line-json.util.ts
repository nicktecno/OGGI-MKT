/** Extrai IDs estáveis das linhas JSON gravadas em `CompositeProduct.linhas`. */

export function supplyItemIdFromCompositeLineJson(row: unknown): string | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  const raw = r.supplyItemId ?? r.supply_item_id;
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return id.length ? id : null;
}

export function quantidadeFromCompositeLineJson(row: unknown): number | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  const qRaw = r.quantidade;
  const q = typeof qRaw === 'number' ? qRaw : Number(qRaw);
  return Number.isFinite(q) && q > 0 ? q : null;
}

export function snapshotCustoFromCompositeLineJson(row: unknown): number {
  if (typeof row !== 'object' || row === null) return 0;
  const r = row as Record<string, unknown>;
  const cRaw = r.snapshot_custo_unitario;
  const c = typeof cRaw === 'number' ? cRaw : Number(cRaw);
  return Number.isFinite(c) && c >= 0 ? c : 0;
}
