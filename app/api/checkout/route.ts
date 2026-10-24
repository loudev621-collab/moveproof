import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Body: { plan: "move_pass", property_id, return_to }
// One-time payment per address: covers that home's move-in and move-out records. Landlords never pay.
export async function POST(req: Request) {
  const stripe = getStripe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { plan, property_id, return_to } = await req.json();
  if (plan !== "move_pass" && plan !== "home_pass") return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const back = typeof return_to === "string" && return_to.startsWith("/") && !return_to.startsWith("//") ? return_to : "/dashboard";
  const price = process.env.STRIPE_PRICE_MOVE_PASS || process.env.STRIPE_PRICE_HOME_PASS;
  if (!price) return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 500 });
  const db = createAdminClient();

  const { data: home } = await db.from("properties").select("id, owner_id, paid, role").eq("id", property_id).single();
  if (!home || home.owner_id !== user.id) return NextResponse.json({ error: "Home not found." }, { status: 404 });
  if (home.paid || home.role === "landlord") return NextResponse.json({ url: `${site}${back}` });

  // One Stripe customer per user, so receipts line up.
  const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  let customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
    customerId = customer.id;
    await db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    metadata: { user_id: user.id, property_id, plan: "move_pass" },
    success_url: `${site}${back}?paid=1`,
    cancel_url: `${site}${back}`,
  });
  await db.from("payments").insert({
    owner_id: user.id, property_id, stripe_session_id: session.id, kind: "move_pass", amount_cents: session.amount_total,
  });
  return NextResponse.json({ url: session.url });
}
