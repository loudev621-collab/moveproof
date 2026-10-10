import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Stripe calls this. The signature check rejects anything not genuinely from Stripe.
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

  const db = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.user_id;
      await db.from("payments").update({ status: "paid", amount_cents: s.amount_total }).eq("stripe_session_id", s.id);

      if (s.mode === "payment" && s.payment_status === "paid" && s.metadata?.property_id && userId) {
        await db.from("properties").update({ paid: true }).eq("id", s.metadata.property_id).eq("owner_id", userId);
      }
      if (s.mode === "subscription" && userId) {
        await db.from("profiles").update({ plan: "landlord", plan_status: "active" }).eq("id", userId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const ended = event.type === "customer.subscription.deleted" || ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
      await db
        .from("profiles")
        .update({ plan: ended ? "free" : "landlord", plan_status: sub.status })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return Response.json({ received: true });
}
