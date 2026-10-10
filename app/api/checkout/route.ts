import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Body: { plan: "home_pass", property_id, return_to } or { plan: "landlord", return_to }
export async function POST(req: Request) {
  const stripe = getStripe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { plan, property_id, return_to } = await req.json();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const back = typeof return_to === "string" && return_to.startsWith("/") && !return_to.startsWith("//") ? return_to : "/dashboard";
  const db = createAdminClient();

  // One Stripe customer per user, so receipts and the billing portal line up.
  const { data: profile } = await db.from("profiles").select("stripe_customer_id, email").eq("id", user.id).single();
  let customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
    customerId = customer.id;
    await db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  if (plan === "home_pass") {
    const { data: home } = await db.from("properties").select("id, owner_id, paid").eq("id", property_id).single();
    if (!home || home.owner_id !== user.id) return NextResponse.json({ error: "Home not found." }, { status: 404 });
    if (home.paid) return NextResponse.json({ url: `${site}${back}` });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_HOME_PASS!, quantity: 1 }],
      metadata: { user_id: user.id, property_id, plan: "home_pass" },
      success_url: `${site}${back}?paid=1`,
      cancel_url: `${site}${back}`,
    });
    await db.from("payments").insert({
      owner_id: user.id, property_id, stripe_session_id: session.id, kind: "home_pass", amount_cents: session.amount_total,
    });
    return NextResponse.json({ url: session.url });
  }

  if (plan === "landlord") {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_LANDLORD!, quantity: 1 }],
      metadata: { user_id: user.id, plan: "landlord" },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${site}${back}?paid=1`,
      cancel_url: `${site}${back}`,
    });
    await db.from("payments").insert({
      owner_id: user.id, stripe_session_id: session.id, kind: "landlord", amount_cents: session.amount_total,
    });
    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
}
