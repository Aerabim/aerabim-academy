import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Returns a Stripe server-side client, or null if STRIPE_SECRET_KEY is not configured.
 * All callers must handle the null case gracefully.
 */
export function getStripeServer(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }

  return stripeInstance;
}
