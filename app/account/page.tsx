import { createClient } from "@/lib/supabase/server";
import BillingButton from "./BillingButton";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const landlord = profile?.plan === "landlord";

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-3xl font-bold">Account</h1>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border border-line bg-card p-5">
        <dt className="text-soft">Email</dt><dd>{profile?.email}</dd>
        <dt className="text-soft">Plan</dt>
        <dd>{landlord ? `Landlord (${profile?.plan_status})` : "Free, plus any Home Passes you've bought"}</dd>
      </dl>
      <div className="mt-6">
        <BillingButton hasBilling={!!profile?.stripe_customer_id} landlord={landlord} />
      </div>
    </div>
  );
}
