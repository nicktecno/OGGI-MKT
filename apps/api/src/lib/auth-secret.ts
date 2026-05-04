import { createHash } from 'node:crypto';

/** Mesmo segredo que o app web usa para assinar a sessão (≥32 caracteres). */
export function getAuthSecretKey(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (raw && raw.length >= 32) {
    return new TextEncoder().encode(raw);
  }
  if (process.env.NODE_ENV !== 'production') {
    return new TextEncoder().encode('dev-only-agregador-auth-secret-32chars!');
  }
  throw new Error('Chave de autenticação ausente ou muito curta (mínimo 32 caracteres).');
}

export function getAuthSecretPreview(): string {
  return createHash('sha256').update(getAuthSecretKey()).digest('hex').slice(0, 8);
}
