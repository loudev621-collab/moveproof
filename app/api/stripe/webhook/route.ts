import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Stripe calls this after a Move Pass payment. The signature check rejects anything not genuinely from Stripe.
// Stripe > Webhooks: listen for checkout.session.completed only.
export async function POST(req: Request) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const db = createAdminClient();
    const userId = s.metadata?.user_id;
    await db.from("payments").update({ status: "paid", amount_cents: s.amount_total }).eq("stripe_session_id", s.id);

    if (s.mode === "payment" && s.payment_status === "paid" && s.metadata?.property_id && userId) {
      await db.from("properties").update({ paid: true }).eq("id", s.metadata.property_id).eq("owner_id", userId);
    }
  }

  return Response.json({ received: true });
}
