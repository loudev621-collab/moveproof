import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ROOMS, KIND_LABELS, address, when } from "@/lib/format";

async function startWalkthrough(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const propertyId = String(formData.get("property_id"));
  const kind = String(formData.get("kind"));
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

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/dashboard" className="text-sm underline">My homes</Link>
      <h1 className="mt-2 text-3xl font-bold">{home.nickname}</h1>
      <p className="text-soft">{address(home)}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {(["move_in", "move_out"] as const).map((kind) => (
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
