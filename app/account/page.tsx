import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { address } from "@/lib/format";
import { MOVE_PASS_PRICE } from "@/lib/brand";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user!.id).single();
  const { data: homes } = await supabase
    .from("properties")
    .select("id, nickname, address_line, unit, city, state, zip, role, paid")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-3xl font-bold">Account</h1>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border border-line bg-card p-5">
        <dt className="text-soft">Email</dt><dd>{profile?.email}</dd>
        <dt className="text-soft">Pricing</dt>
        <dd>Renters: {MOVE_PASS_PRICE} once per address. Landlords: free. No subscriptions.</dd>
      </dl>

      <h2 className="mt-10 text-xl font-bold">Your homes</h2>
      {!homes?.length ? (
        <p className="mt-3 text-soft">None yet. <Link href="/properties/new" className="underline">Add a home</Link>.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border border-line bg-card">
          {homes.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-4 p-4">
              <Link href={`/properties/${h.id}`}>
                <p className="font-semibold">{h.nickname}</p>
                <p className="text-sm text-soft">{address(h)}</p>
              </Link>
              <span className="text-sm text-soft">
                {h.role === "landlord" ? "Landlord, free" : h.paid ? "Move Pass" : "No pass yet"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-soft">Receipts for Move Passes are emailed by Stripe.</p>
    </div>
  );
}
