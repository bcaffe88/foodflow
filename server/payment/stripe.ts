import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY must be set in production");
  }
  console.warn("[Stripe] ⚠️ STRIPE_SECRET_KEY not set - payment features will be disabled");
}

export const stripe = stripeKey ? new Stripe(stripeKey) : null;
