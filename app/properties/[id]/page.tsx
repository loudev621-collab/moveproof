import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ROOMS, KIND_LABELS, address, when } from "@/lib/format";
import { AB2801_STEPS, isCalifornia } from "@/lib/california";
import { MOVE_PASS_PRICE } from "@/lib/brand";

// Renters record move-in and move-out. Landlords also record after repairs or cleaning (AB 2801 step 3).
function kindsFor(role: string) {
  return role === "landlord" ? (["move_in", "move_out", "after_repairs"] as const) : (["move_in", "move_out"] as const);
}

async function startWalkthrough(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id"));
  const kind = String(formData.get("kind"));
  const { data: home } = await supabase.from("properties").select("id, role").eq("id", propertyId).maybeSingle();
  if (!home || !(kindsFor(home.role) as readonly string[]).includes(kind)) throw new Error("That walkthrough type isn't available for this home.");

  const { data: walk, error } = await supabase
    .from("walkthroughs")
    .insert({ property_id: propertyId, owner_id: user.id, kind })
    .select("id")
    .single();
  if (error || !walk) throw new Error("We couldn't start the walkthrough. Try again.");

  await supabase.from("rooms").insert(
    DEFAULT_ROOMS.map((name, position) => ({ walkthrough_id: walk.id, owner_id: user.id, name, position }))
  );
  redirect(`/walkthrough/${walk.id}`);
}

export default async function HomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: home } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (!home) notFound();

  const { data: walks } = await supabase
    .from("walkthroughs")
    .select("id, kind, status, started_at, completed_at, photos(count)")
    .eq("property_id", id)
    .order("started_at", { ascending: false });

  const kinds = kindsFor(home.role);
  const ca = isCalifornia(home.state);
  const done = new Set((walks ?? []).filter((w) => w.status === "completed").map((w) => w.kind));
  const steps = AB2801_STEPS.filter((s) => (kinds as readonly string[]).includes(s.kind));

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/dashboard" className="text-sm underline">My homes</Link>
      <h1 className="mt-2 text-3xl font-bold">{home.nickname}</h1>
      <p className="text-soft">{address(home)}</p>
      <p className="mt-2 text-sm">
        {home.role === "landlord"
          ? "Landlord: free, every record."
          : home.paid
            ? "Move Pass active: move-in and move-out records for this home."
            : `Taking photos is free. A ${MOVE_PASS_PRICE} Move Pass unlocks the PDF and share links for this home.`}
      </p>

      {ca && (
        <section className="mt-8 border border-line bg-card p-5">
          <h2 className="font-bold">California AB 2801 photo steps</h2>
          <ul className="mt-3 space-y-2">
            {steps.map((s) => (
              <li key={s.kind} className="flex gap-3">
                <span className={`mt-0.5 font-bold ${done.has(s.kind) ? "text-ok" : "text-soft"}`}>{done.has(s.kind) ? "✓" : "○"}</span>
                <span>
                  <span className="font-semibold">{s.label}:</span> <span className="text-soft">{s.when}.</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-soft">Plain-language summary, not legal advice.</p>
        </section>
      )}

      <div className={`mt-8 grid gap-3 ${kinds.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {kinds.map((kind) => (
          <form key={kind} action={startWalkthrough}>
            <input type="hidden" name="property_id" value={home.id} />
            <input type="hidden" name="kind" value={kind} />
            <button className="w-full rounded-md bg-ink px-4 py-4 text-lg font-semibold text-card">
              Start {KIND_LABELS[kind].toLowerCase()} walkthrough
            </button>
          </form>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold">Walkthroughs</h2>
      {!walks?.length ? (
        <p className="mt-3 text-soft">None yet. Start one on moving day.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border border-line bg-card">
          {walks.map((w) => (
            <li key={w.id}>
              <Link
                href={w.status === "completed" ? `/walkthrough/${w.id}/report` : `/walkthrough/${w.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-wall"
              >
                <div>
                  <p className="font-semibold">{KIND_LABELS[w.kind]}</p>
                  <p className="text-sm text-soft">Started {when(w.started_at)}, {w.photos?.[0]?.count ?? 0} photos</p>
                </div>
                <span className={`text-sm font-semibold ${w.status === "completed" ? "text-ok" : "text-soft"}`}>
                  {w.status === "completed" ? "Locked" : "In progress"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
