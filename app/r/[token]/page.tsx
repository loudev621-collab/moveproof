import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONDITION_LABELS, address, recordTitle, when } from "@/lib/format";
import { isCalifornia } from "@/lib/california";
import { MOVE_PASS_PRICE, NO_APP } from "@/lib/brand";
import { acknowledge } from "./actions";

// Public page for the other party: no account, no app. Never indexed by search engines.
export const metadata: Metadata = { title: "Doorstamp record", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Photo = { id: string; room_id: string; storage_path: string; sha256: string; uploaded_at: string };

export default async function SharedRecord({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ack?: string }>;
}) {
  const { token } = await params;
  const { ack } = await searchParams;
  const db = createAdminClient();

  const { data: share } = await db
    .from("shares")
    .select("id, owner_id, walkthrough_id, revoked_at, first_viewed_at, view_count, acknowledged_at, ack_name")
    .eq("token", token)
    .maybeSingle();

  if (!share || share.revoked_at) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">This link isn&apos;t available</h1>
        <p className="mt-2 text-soft">It may have been turned off. Ask the person who sent it for a new link.</p>
      </div>
    );
  }

  // Count views from anyone other than the owner.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id !== share.owner_id) {
    await db
      .from("shares")
      .update({ view_count: share.view_count + 1, first_viewed_at: share.first_viewed_at ?? new Date().toISOString() })
      .eq("id", share.id);
  }

  const { data: walk } = await db.from("walkthroughs").select("*, properties(*)").eq("id", share.walkthrough_id).single();
  const { data: rooms } = await db.from("rooms").select("id, name, condition, notes").eq("walkthrough_id", walk.id).order("position");
  const { data: photoRows } = await db
    .from("photos")
    .select("id, room_id, storage_path, sha256, uploaded_at")
    .eq("walkthrough_id", walk.id)
    .order("uploaded_at");
  const photos = (photoRows ?? []) as Photo[];
  const { data: signed } = photos.length
    ? await db.storage.from("evidence").createSignedUrls(photos.map((p) => p.storage_path), 3600)
    : { data: [] as { signedUrl: string }[] };
  const urls = new Map(photos.map((p, i) => [p.id, signed?.[i]?.signedUrl ?? null]));

  const home = walk.properties;
  const ownerIsLandlord = home.role === "landlord";

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm text-soft">Shared by the {ownerIsLandlord ? "landlord" : "renter"} · {NO_APP}</p>
      <h1 className="mt-1 text-3xl font-bold">{recordTitle(walk.kind, home.state)}</h1>
      <p className="text-soft">{address(home)}</p>
      <p className="mt-3 text-sm font-semibold text-ok">
        Locked {when(walk.completed_at)}. Nothing in this record can be changed, including by the sender.
      </p>
      {isCalifornia(home.state) && (
        <p className="mt-2 text-sm text-soft">Organized around California AB 2801&apos;s photo steps. Not legal advice.</p>
      )}

      {/* Acknowledge */}
      <section className="mt-8 border-2 border-ink bg-card p-5">
        {share.acknowledged_at ? (
          <p className="font-semibold text-ok">Acknowledged by {share.ack_name} on {when(share.acknowledged_at)}.</p>
        ) : (
          <form action={acknowledge} className="space-y-3">
            <h2 className="font-bold">Acknowledge you received this record</h2>
            <p className="text-sm text-soft">
              This confirms you received and viewed it. It does not mean you agree with everything in it.
            </p>
            <input type="hidden" name="token" value={token} />
            <label className="block text-sm font-semibold">Your name
              <input name="name" required maxLength={80} className="mt-1 w-full rounded-md border border-line px-3 py-3 font-normal" />
            </label>
            <label className="block text-sm font-semibold">Note <span className="font-normal text-soft">(optional)</span>
              <textarea name="note" maxLength={500} rows={2} className="mt-1 w-full rounded-md border border-line px-3 py-2 font-normal" />
            </label>
            {ack === "missing" && <p className="text-sm text-bad">Type your name to acknowledge.</p>}
            <button className="w-full rounded-md bg-ink px-4 py-3 font-semibold text-card">Acknowledge</button>
          </form>
        )}
      </section>

      {/* Rooms and photos */}
      {(rooms ?? []).map((room) => {
        const roomPhotos = photos.filter((p) => p.room_id === room.id);
        return (
          <section key={room.id} className="mt-10">
            <h2 className="text-xl font-bold">{room.name}</h2>
            <p className="text-sm text-soft">
              Condition: {room.condition ? CONDITION_LABELS[room.condition] : "not marked"}
              {room.notes ? ` · Notes: ${room.notes}` : ""}
            </p>
            {!roomPhotos.length ? (
              <p className="mt-3 text-soft">No photos in this room.</p>
            ) : (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {roomPhotos.map((p) => (
                  <figure key={p.id} className="border border-line bg-card p-2">
                    {urls.get(p.id) && (
                      <a href={urls.get(p.id)!} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={urls.get(p.id)!} alt={`${room.name} photo`} loading="lazy" className="w-full" />
                      </a>
                    )}
                    <figcaption className="mt-2 font-mono text-xs text-soft">
                      Uploaded {when(p.uploaded_at)}
                      <br />
                      SHA-256 {p.sha256.slice(0, 16)}…{p.sha256.slice(-6)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Growth loop: invite the other side to make their own record */}
      <section className="mt-14 border border-line bg-card p-5">
        {ownerIsLandlord ? (
          <>
            <h2 className="font-bold">Renting this home? Make your own record too.</h2>
            <p className="mt-1 text-soft">{MOVE_PASS_PRICE} once per address, move-in and move-out. {NO_APP}.</p>
            <Link href="/properties/new" className="mt-3 inline-block font-semibold underline">Start free</Link>
          </>
        ) : (
          <>
            <h2 className="font-bold">Landlord? Doorstamp is free for you.</h2>
            <p className="mt-1 text-soft">Move-in, move-out and after-repair records for every unit. Send each tenant the link.</p>
            <Link href="/properties/new?role=landlord" className="mt-3 inline-block font-semibold underline">Add a rental, free</Link>
          </>
        )}
      </section>
    </div>
  );
}
