import Stripe from "stripe";

/** Cliente Stripe só no servidor (rotas /api, Server Components). Sandbox: `sk_test_…`. */
export function getStripeServer(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

export function stripePaymentsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
