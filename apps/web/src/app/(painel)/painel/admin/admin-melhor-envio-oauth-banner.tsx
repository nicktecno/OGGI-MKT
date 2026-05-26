"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = {
  oauthStartUrl: string | null;
};

export function AdminMelhorEnvioOAuthBanner({ oauthStartUrl }: Props) {
  const params = useSearchParams();
  const ok = params.get("me_oauth") === "ok";
  const err = params.get("me_oauth_error");

  if (!ok && !err && !oauthStartUrl) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
      {ok ? (
        <p className="text-emerald-800 dark:text-emerald-200" role="status">
          Melhor Envio conectado com sucesso. Teste o frete na loja ou no checkout.
        </p>
      ) : null}
      {err ? (
        <p className="text-destructive" role="alert">
          Falha ao conectar Melhor Envio: {decodeURIComponent(err)}
        </p>
      ) : null}
      {oauthStartUrl ? (
        <p className="text-muted-foreground leading-relaxed">
          Frete na loja exige token de <strong className="text-foreground">produção</strong> (
          <code className="text-xs">melhorenvio.com.br</code>
          ). Se aparecer erro 401, renove o OAuth:
        </p>
      ) : null}
      {oauthStartUrl ? (
        <Link
          href={oauthStartUrl}
          className="inline-flex font-medium text-foreground underline-offset-4 hover:underline"
        >
          Conectar / renovar Melhor Envio (OAuth)
        </Link>
      ) : null}
    </div>
  );
}
