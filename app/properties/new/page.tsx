import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createHome(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      nickname: get("nickname") || get("address_line"),
      address_line: get("address_line"),
      unit: get("unit") || null,
      city: get("city"),
      state: get("state").toUpperCase(),
      zip: get("zip"),
      role: get("role") === "landlord" ? "landlord" : "renter",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("We couldn't save this home. Check the address and try again.");
  redirect(`/properties/${data.id}`);
}

export default function NewHome() {
  const field = "mt-1 w-full rounded-md border border-line bg-card px-3 py-3";
  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <h1 className="text-3xl font-bold">Add a home</h1>
      <form action={createHome} className="mt-8 space-y-5">
        <fieldset>
          <legend className="font-semibold">I'm the</legend>
          <div className="mt-2 flex gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-md border border-line bg-card p-3">
              <input type="radio" name="role" value="renter" defaultChecked /> Renter
            </label>
            <label className="flex flex-1 items-center gap-2 rounded-md border border-line bg-card p-3">
              <input type="radio" name="role" value="landlord" /> Landlord
            </label>
          </div>
        </fieldset>
        <label className="block font-semibold">Nickname <span className="font-normal text-soft">(optional)</span>
          <input name="nickname" placeholder="Maple St apartment" className={field} />
        </label>
        <label className="block font-semibold">Street address
          <input name="address_line" required autoComplete="address-line1" className={field} />
        </label>
        <label className="block font-semibold">Unit <span className="font-normal text-soft">(optional)</span>
          <input name="unit" autoComplete="address-line2" className={field} />
        </label>
        <div className="grid grid-cols-[1fr_5rem_7rem] gap-3">
          <label className="block font-semibold">City<input name="city" required autoComplete="address-level2" className={field} /></label>
          <label className="block font-semibold">State<input name="state" required maxLength={2} autoComplete="address-level1" className={field} /></label>
          <label className="block font-semibold">ZIP<input name="zip" required inputMode="numeric" maxLength={10} autoComplete="postal-code" className={field} /></label>
        </div>
        <button className="w-full rounded-md bg-ink px-4 py-3.5 font-semibold text-card">Save home</button>
      </form>
    </div>
  );
}
