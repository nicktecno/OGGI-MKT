import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { CheckoutPurchaseAnalytics } from "@/components/analytics/checkout-purchase-analytics";
import { CheckoutClearAfterPayment } from "@/components/loja/checkout-clear-after-payment";
import { buttonVariants } from "@/components/ui/button";
import { finalizeStripePaidCheckoutInventory } from "@/lib/stripe-checkout-finalize";
import { getStripeServer } from "@/lib/stripe-server";
import { getSession } from "@/lib/session";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pagamento",
  description: `Confirmação de pagamento — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutObrigadoPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  const userSession = await getSession();
  const stripe = getStripeServer();

  if (!sessionId || !stripe) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-serif text-2xl font-medium">Não foi possível confirmar</h1>
        <p className="mt-3 text-muted-foreground">
          Falta o identificador da sessão ou o Stripe não está configurado neste ambiente.
        </p>
        <Link href="/checkout" className={cn(buttonVariants(), "mt-8 inline-flex")}>
          Voltar ao checkout
        </Link>
      </main>
    );
  }

  let paid = false;
  let amountDisplay: string | null = null;
  let valueBrl: number | null = null;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    paid = s.payment_status === "paid";
    if (typeof s.amount_total === "number" && s.amount_total > 0) {
      valueBrl = s.amount_total / 100;
      amountDisplay = valueBrl.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
  } catch {
    paid = false;
  }

  let inventoryMessage: string | null = null;
  if (paid && sessionId) {
    const inv = await finalizeStripePaidCheckoutInventory(sessionId);
    if (!inv.ok) {
      inventoryMessage = inv.message;
    } else {
      revalidatePath("/painel/cliente");
      revalidatePath("/painel/cliente/pedidos");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <CheckoutPurchaseAnalytics paid={paid} transactionId={sessionId} valueBrl={valueBrl} />
      {paid ? (
        <>
          <CheckoutClearAfterPayment />
          <h1 className="font-serif text-2xl font-medium text-foreground">Pagamento recebido</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Obrigado pela compra. {amountDisplay ? `Total: ${amountDisplay}.` : null}{" "}
            O carrinho neste navegador foi esvaziado e o estoque da oferta foi atualizado.
          </p>
          {inventoryMessage ? (
            <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Aviso: o pagamento foi concluído, mas houve um problema ao sincronizar o estoque:{" "}
              {inventoryMessage} Guarde o ID da sessão e fale com o suporte.
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            Se o site estiver com e-mail configurado, você pode receber uma confirmação na caixa de
            entrada (confira também o spam).
          </p>
        </>
      ) : (
        <>
          <h1 className="font-serif text-2xl font-medium text-foreground">Pagamento pendente ou inválido</h1>
          <p className="mt-3 text-muted-foreground">
            Não encontramos uma sessão paga com esse link. Se fechou a janela do Stripe antes de
            concluir, tente novamente no checkout.
          </p>
        </>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/loja" className={cn(buttonVariants())}>
          Voltar à loja
        </Link>
        {paid && userSession?.role === "CUSTOMER" ? (
          <Link href="/painel/cliente/pedidos" className={cn(buttonVariants({ variant: "outline" }))}>
            Meus pedidos
          </Link>
        ) : null}
        <Link href="/checkout" className={cn(buttonVariants({ variant: "outline" }))}>
          Checkout
        </Link>
      </div>
    </main>
  );
}
