import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { commerceUsesDatabase } from "@/lib/commerce-backend";
import {
  fetchCustomerStoreOrders,
  type StoreOrderLineDto,
} from "@/lib/platform-account-server";
import { getSession } from "@/lib/session";
import { formatBrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Meus pedidos",
  robots: { index: false, follow: false },
};

function channelLabel(ch: string): string {
  if (ch === "STRIPE") return "Stripe";
  if (ch === "DEMO") return "Confirmação demo";
  return ch;
}

function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function PainelClientePedidosPage() {
  const session = await getSession();
  if (!session) redirect("/entrar?next=/painel/cliente/pedidos");
  if (session.role !== "CUSTOMER") redirect("/painel");

  const orders = commerceUsesDatabase() ? await fetchCustomerStoreOrders() : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-border/60 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Comprador</p>
        <h1 className="font-serif text-3xl font-medium tracking-tight">Meus pedidos</h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          Pedidos concluídos com a API e banco de dados configurados aparecem aqui após finalizar a compra.
        </p>
      </header>

      {orders === null ? (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Histórico indisponível</CardTitle>
            <CardDescription>
              Ligue o site à API (variáveis de ambiente) para gravar e listar pedidos.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Nenhum pedido ainda</CardTitle>
            <CardDescription>
              Quando você finalizar uma compra, o resumo aparecerá nesta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/loja" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Ir à loja
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-6">
          {orders.map((o) => (
            <li key={o.id}>
              <Card className="border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <CardTitle className="font-serif text-lg">
                      Pedido · {formatOrderDate(o.created_at)}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">{channelLabel(o.channel)}</span>
                  </div>
                  {typeof o.total_brl === "number" && Number.isFinite(o.total_brl) ? (
                    <CardDescription>Total {formatBrl(o.total_brl)}</CardDescription>
                  ) : null}
                  {o.stripe_session_id ? (
                    <p className="font-mono text-xs text-muted-foreground">
                      Ref. Stripe: {o.stripe_session_id}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  {o.delivery && typeof o.delivery === "object" && o.delivery !== null ? (
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                      <p className="font-medium text-foreground">Entrega</p>
                      <DeliverySummary d={o.delivery as Record<string, unknown>} />
                    </div>
                  ) : null}
                  <ul className="space-y-3 text-sm">
                    {o.lines.map((l) => (
                      <li
                        key={l.id ?? `${o.id}-${l.listing_id}-${l.product_slug}`}
                        className="flex flex-col gap-2 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span>
                            <Link
                              href={`/loja/produto/${encodeURIComponent(l.product_slug)}`}
                              className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                              {l.product_name}
                            </Link>
                            <span className="text-muted-foreground"> × {l.quantity}</span>
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatBrl(l.unit_price_brl * l.quantity)}
                          </span>
                        </div>
                        <OrderLineShipmentStatus line={l} />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderLineShipmentStatus({ line }: { line: StoreOrderLineDto }) {
  const posted =
    typeof line.posted_at === "string" && line.posted_at.trim().length > 0 ? line.posted_at : null;
  if (!posted) {
    return (
      <p className="text-xs text-muted-foreground">
        <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 font-medium text-foreground">
          Envio
        </span>{" "}
        <span className="text-muted-foreground">Aguardando postagem pela costureira.</span>
      </p>
    );
  }
  let postedLabel = posted;
  try {
    postedLabel = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(posted));
  } catch {
    /* keep raw */
  }
  const tracking =
    typeof line.tracking_code === "string" && line.tracking_code.trim()
      ? line.tracking_code.trim()
      : null;
  const carrier =
    typeof line.carrier_name === "string" && line.carrier_name.trim()
      ? line.carrier_name.trim()
      : null;
  return (
    <div className="space-y-1 text-xs leading-relaxed">
      <p>
        <span className="inline-flex items-center rounded-md border border-emerald-600/30 bg-emerald-600/10 px-2 py-0.5 font-medium text-emerald-900 dark:text-emerald-100">
          Postado
        </span>{" "}
        <span className="text-muted-foreground">{postedLabel}</span>
      </p>
      {carrier ? (
        <p className="text-muted-foreground">
          Transportadora: <span className="font-medium text-foreground">{carrier}</span>
        </p>
      ) : null}
      {tracking ? (
        <p className="text-muted-foreground">
          Rastreio:{" "}
          <span className="font-mono font-medium text-foreground tabular-nums">{tracking}</span>
        </p>
      ) : null}
    </div>
  );
}

function DeliverySummary({ d }: { d: Record<string, unknown> }) {
  const name = typeof d.recipientName === "string" ? d.recipientName : "";
  const phone = typeof d.phone === "string" ? d.phone : "";
  const street = typeof d.street === "string" ? d.street : "";
  const number = typeof d.number === "string" ? d.number : "";
  const comp = typeof d.complement === "string" ? d.complement : "";
  const nb = typeof d.neighborhood === "string" ? d.neighborhood : "";
  const city = typeof d.city === "string" ? d.city : "";
  const uf = typeof d.uf === "string" ? d.uf : "";
  const cep = typeof d.cep === "string" ? d.cep : "";
  const line1 = [street, number].filter(Boolean).join(", ");
  const line2 = [nb, city, uf].filter(Boolean).join(" — ");
  return (
    <p className="mt-1 text-muted-foreground leading-relaxed">
      {[name, phone].filter(Boolean).join(" · ")}
      <br />
      {line1}
      {comp ? ` — ${comp}` : ""}
      <br />
      {line2}
      {cep ? ` · CEP ${cep}` : ""}
    </p>
  );
}
