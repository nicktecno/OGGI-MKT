/**
 * Origem HTTPS pública para redirects server-side (ex.: Stripe `success_url`).
 * Em produção, ignora `NEXT_PUBLIC_APP_URL` se apontar para localhost (erro comum ao copiar .env).
 */
export function resolvePublicRedirectOrigin(req: Request): string {
  const isProd = process.env.NODE_ENV === "production";

  const toOrigin = (raw: string | undefined): string | null => {
    const t = raw?.trim();
    if (!t) return null;
    try {
      const u = /^https?:\/\//i.test(t) ? new URL(t) : new URL(`https://${t}`);
      return u.origin.replace(/\/$/, "");
    } catch {
      return null;
    }
  };

  const isLocalhost = (origin: string): boolean => {
    try {
      const h = new URL(origin).hostname;
      return h === "localhost" || h === "127.0.0.1";
    } catch {
      return false;
    }
  };

  const explicit = toOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (explicit && !(isProd && isLocalhost(explicit))) {
    return explicit;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const vercelHost = process.env.VERCEL_URL?.trim();
  const fromVercelHost = (host: string) => {
    const h = host.replace(/^https?:\/\//i, "");
    return toOrigin(`https://${h}`);
  };

  /** Preview / dev na Vercel: sempre o host deste deploy (não mandar para produção). */
  if (vercelEnv === "preview" || vercelEnv === "development") {
    if (vercelHost) {
      const o = fromVercelHost(vercelHost);
      if (o) return o;
    }
    return new URL(req.url).origin;
  }

  /** Produção na Vercel: domínio principal do projeto, senão o host do deploy. */
  if (vercelEnv === "production") {
    const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (prodUrl) {
      const o = toOrigin(prodUrl);
      if (o) return o;
    }
  }

  if (vercelHost) {
    const o = fromVercelHost(vercelHost);
    if (o) return o;
  }

  return new URL(req.url).origin;
}
