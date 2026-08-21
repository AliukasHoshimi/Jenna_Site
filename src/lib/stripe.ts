import "server-only";
import Stripe from "stripe";

let cachedClient: Stripe | null = null;

export function stripe() {
  if (cachedClient) return cachedClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  cachedClient = new Stripe(key);
  return cachedClient;
}
