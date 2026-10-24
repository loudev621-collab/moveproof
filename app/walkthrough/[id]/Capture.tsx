"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressPhoto, sha256Hex } from "@/lib/browser";
import { KIND_LABELS } from "@/lib/format";
import { AB2801_STEPS, isCalifornia } from "@/lib/california";

const RENTER_TIPS: Record<string, string> = {
  move_in: "On move-in day, before you unpack.",
  move_out: "After you clean, before you hand back the keys.",
};

type Room = { id: string; name: string; position: number; condition: string | null; notes: string | null };
type Photo = { id: string; room_id: string; storage_path: string; caption: string | null; uploaded_at?: string; preview: string | null; saving?: boolean; failed?: boolean };
type Walk = { id: string; kind: string; other_party_name: string | null; notes: string | null; properties: { nickname: string; state: string; role: string } | null };

export default function Capture({ userId, walkthrough, initialRooms, initialPhotos }: {
  userId: string; walkthrough: Walk; initialRooms: Room[]; initialPhotos: Photo[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [openRoom, setOpenRoom] = useState<string | null>(initialRooms[0]?.id ?? null);
  const [newRoom, setNewRoom] = useState("");
  const [otherParty, setOtherParty] = useState(walkthrough.other_party_name ?? "");
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = photos.filter((p) => p.saving).length;
  // Landlords see the AB 2801 timing (their legal duty). Renters see when their own photos help most.
  const landlord = walkthrough.properties?.role === "landlord";
  const step = landlord && isCalifornia(walkthrough.properties?.state) ? AB2801_STEPS.find((s) => s.kind === walkthrough.kind) : undefined;
  const renterTip = !landlord ? RENTER_TIPS[walkthrough.kind] : undefined;

  async function addPhotos(roomId: string, list: FileList | null) {
    if (!list) return;
    for (const file of Array.from(list)) {
      const id = crypto.randomUUID();
      const path = `${userId}/${walkthrough.id}/${id}.jpg`;
      try {
        const jpeg = await compressPhoto(file);
        const preview = URL.createObjectURL(jpeg);
        setPhotos((ps) => [...ps, { id, room_id: roomId, storage_path: path, caption: null, preview, saving: true }]);

        const sha256 = await sha256Hex(jpeg);
        const { error: upErr } = await supabase.storage.from("evidence").upload(path, jpeg, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw upErr;
        const { data, error: rowErr } = await supabase
          .from("photos")
          .insert({
            id, room_id: roomId, walkthrough_id: walkthrough.id, owner_id: userId, storage_path: path,
            sha256, bytes: jpeg.size, device_time: new Date(file.lastModified).toISOString(),
          })
          .select("uploaded_at")
          .single();
        if (rowErr) throw rowErr;
        setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, saving: false, uploaded_at: data.uploaded_at } : p)));
      } catch {
        setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, saving: false, failed: true } : p)));
        setError("A photo didn't save. Check your signal, remove it, and take it again.");
      }
    }
  }

  async function removePhoto(p: Photo) {
    if (!p.failed) {
      await supabase.from("photos").delete().eq("id", p.id);
      await supabase.storage.from("evidence").remove([p.storage_path]);
    }
    setPhotos((ps) => ps.filter((x) => x.id !== p.id));
  }

  async function updateRoom(room: Room, changes: Partial<Room>) {
    setRooms((rs) => rs.map((r) => (r.id === room.id ? { ...r, ...changes } : r)));
    await supabase.from("rooms").update(changes).eq("id", room.id);
  }

  async function addRoom() {
    const name = newRoom.trim();
    if (!name) return;
    const { data } = await supabase
      .from("rooms")
      .insert({ walkthrough_id: walkthrough.id, owner_id: userId, name, position: rooms.length })
      .select("*")
      .single();
    if (data) { setRooms([...rooms, data]); setOpenRoom(data.id); setNewRoom(""); }
  }

  async function finish() {
    if (pendingCount) return setError("Wait for every photo to finish saving.");
    if (!confirm("Lock this walkthrough? After this, nothing can be added, changed or deleted.")) return;
    setFinishing(true);
    const { error: err } = await supabase
      .from("walkthroughs")
      .update({ status: "completed", other_party_name: otherParty.trim() || null })
      .eq("id", walkthrough.id);
    if (err) { setError("Couldn't lock the walkthrough. Try again."); setFinishing(false); return; }
    router.push(`/walkthrough/${walkthrough.id}/report`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm text-soft">{walkthrough.properties?.nickname}</p>
      <h1 className="text-2xl font-bold">{KIND_LABELS[walkthrough.kind]} walkthrough</h1>
      <p className="mt-1 text-soft">Photograph each room: walls, floors, appliances, and anything already damaged. Rooms, not people.</p>
      {step && (
        <p className="mt-3 border-l-4 border-tape bg-card p-3 text-sm">
          <span className="font-semibold">California AB 2801 timing:</span> {step.when}.
        </p>
      )}
      {renterTip && (
        <p className="mt-3 border-l-4 border-tape bg-card p-3 text-sm">
          <span className="font-semibold">Best time:</span> {renterTip}
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {rooms.map((room) => {
          const roomPhotos = photos.filter((p) => p.room_id === room.id);
          const open = openRoom === room.id;
          return (
            <li key={room.id} className="border border-line bg-card">
              <button onClick={() => setOpenRoom(open ? null : room.id)} className="flex w-full items-center justify-between p-4 text-left">
                <span className="font-semibold">{room.name}</span>
                <span className={`text-sm ${roomPhotos.length ? "text-ok" : "text-soft"}`}>
                  {roomPhotos.length ? `${roomPhotos.length} photo${roomPhotos.length > 1 ? "s" : ""}` : "No photos yet"}
                </span>
              </button>
              {open && (
                <div className="space-y-4 border-t border-line p-4">
                  <label className="flex cursor-pointer items-center justify-center rounded-md bg-ink px-4 py-4 text-lg font-semibold text-card">
                    Take photo
                    <input type="file" accept="image/*" capture="environment" multiple className="sr-only"
                      onChange={(e) => { addPhotos(room.id, e.target.files); e.target.value = ""; }} />
                  </label>
                  {roomPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {roomPhotos.map((p) => (
                        <div key={p.id} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.preview && <img src={p.preview} alt={`${room.name} photo`} className="aspect-square w-full object-cover" />}
                          <p className={`mt-1 text-xs ${p.failed ? "text-bad" : p.saving ? "text-soft" : "text-ok"}`}>
                            {p.failed ? "Didn't save" : p.saving ? "Saving…" : "Saved"}
                          </p>
                          <button onClick={() => removePhoto(p)} className="text-xs text-soft underline">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <fieldset>
                    <legend className="text-sm font-semibold">Condition</legend>
                    <div className="mt-2 flex gap-2">
                      {["good", "fair", "damaged"].map((c) => (
                        <button key={c} onClick={() => updateRoom(room, { condition: c })}
                          className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${room.condition === c ? "border-ink bg-ink text-card" : "border-line"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="block text-sm font-semibold">Notes
                    <textarea defaultValue={room.notes ?? ""} rows={2} placeholder="e.g. small scratch on oven door, there at move-in"
                      onBlur={(e) => e.target.value !== (room.notes ?? "") && updateRoom(room, { notes: e.target.value })}
                      className="mt-1 w-full rounded-md border border-line px-3 py-2 font-normal" />
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex gap-2">
        <input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Add a room, e.g. Bedroom 2"
          className="flex-1 rounded-md border border-line bg-card px-3 py-3" />
        <button onClick={addRoom} className="rounded-md border border-ink px-4 font-semibold">Add</button>
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <label className="block font-semibold">Landlord or tenant name <span className="font-normal text-soft">(optional)</span>
          <input value={otherParty} onChange={(e) => setOtherParty(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-3" />
        </label>
        {error && <p className="mt-4 text-sm text-bad">{error}</p>}
        <button onClick={finish} disabled={finishing}
          className="mt-5 w-full rounded-md bg-ok px-4 py-4 text-lg font-semibold text-card disabled:opacity-60">
          {finishing ? "Locking…" : pendingCount ? `Saving ${pendingCount} photo${pendingCount > 1 ? "s" : ""}…` : "Finish and lock walkthrough"}
        </button>
        <p className="mt-2 text-center text-sm text-soft">Locking is permanent. That is what makes the record trustworthy.</p>
      </div>
    </div>
  );
}
