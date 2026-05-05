import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutClearAfterPayment } from "@/components/loja/checkout-clear-after-payment";
import { buttonVariants } from "@/components/ui/button";
import { getStripeServer } from "@/lib/stripe-server";
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
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    paid = s.payment_status === "paid";
    if (typeof s.amount_total === "number" && s.amount_total > 0) {
      amountDisplay = (s.amount_total / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
  } catch {
    paid = false;
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      {paid ? (
        <>
          <CheckoutClearAfterPayment />
          <h1 className="font-serif text-2xl font-medium text-foreground">Pagamento recebido</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Obrigado pela compra no modo teste do Stripe. {amountDisplay ? `Total: ${amountDisplay}.` : null}{" "}
            O carrinho deste aparelho foi esvaziado.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Em produção, este passo aciona confirmação de pedido, estoque e e-mails — aqui é apenas
            confirmação do sandbox.
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
        <Link href="/checkout" className={cn(buttonVariants({ variant: "outline" }))}>
          Checkout
        </Link>
      </div>
    </main>
  );
}
