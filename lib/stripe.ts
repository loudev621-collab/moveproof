import Stripe from "stripe";

// SERVER ONLY.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
