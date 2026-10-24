import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { address } from "@/lib/format";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: homes } = await supabase
    .from("properties")
    .select("id, nickname, address_line, unit, city, state, zip, role, paid, walkthroughs(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">My homes</h1>
        <Link href="/properties/new" className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-card">Add a home</Link>
      </div>
      {!homes?.length ? (
        <div className="mt-10 border border-dashed border-line bg-card p-8 text-center">
          <p className="font-semibold">Add the home you're moving into or out of.</p>
          <p className="mt-1 text-soft">Then start a walkthrough and photograph each room.</p>
          <Link href="/properties/new" className="mt-5 inline-block rounded-md bg-ink px-5 py-3 font-semibold text-card">Add a home</Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border border-line bg-card">
          {homes.map((h) => (
            <li key={h.id}>
              <Link href={`/properties/${h.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-wall">
                <div>
                  <p className="font-semibold">{h.nickname}</p>
                  <p className="text-sm text-soft">{address(h)}</p>
                </div>
                <span className="text-sm text-soft">
                  {h.walkthroughs?.[0]?.count ?? 0} walkthroughs
                  {h.role === "landlord" ? ", landlord (free)" : h.paid ? ", Move Pass" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
