import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canDownload } from "@/lib/access";
import { KIND_LABELS, CONDITION_LABELS, address } from "@/lib/format";

export const runtime = "nodejs";
export const maxDuration = 60;

type Room = { id: string; name: string; condition: string | null; notes: string | null };
type Photo = { id: string; room_id: string; storage_path: string; sha256: string; caption: string | null; uploaded_at: string; device_time: string | null };

const PAGE_W = 612, PAGE_H = 792, MARGIN = 50;
const INK = rgb(0.09, 0.13, 0.16), SOFT = rgb(0.35, 0.39, 0.43), BAD = rgb(0.7, 0.14, 0.1);
const TZ = process.env.REPORT_TIMEZONE || "UTC";

// Standard PDF fonts only cover basic Latin characters.
function clean(s: string | null | undefined) {
  return (s ?? "")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "?");
}

function stamp(iso: string | null) {
  if (!iso) return "not recorded";
  return new Date(iso).toLocaleString("en-US", { timeZone: TZ, dateStyle: "medium", timeStyle: "long" });
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const para of clean(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

function makeCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
  const pick = () => chars[randomInt(chars.length)];
  return `${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { walkthrough_id } = await req.json();
  const db = createAdminClient();

  const { data: walk } = await db
    .from("walkthroughs")
    .select("*, properties(*)")
    .eq("id", walkthrough_id)
    .single();
  if (!walk || walk.owner_id !== user.id) return NextResponse.json({ error: "Walkthrough not found." }, { status: 404 });
  if (walk.status !== "completed") return NextResponse.json({ error: "Finish the walkthrough first." }, { status: 409 });

  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!canDownload(profile, walk.properties)) return NextResponse.json({ error: "Payment needed." }, { status: 402 });

  const { data: rooms } = await db.from("rooms").select("id, name, condition, notes").eq("walkthrough_id", walk.id).order("position");
  const { data: photoRows } = await db
    .from("photos")
    .select("id, room_id, storage_path, sha256, caption, uploaded_at, device_time")
    .eq("walkthrough_id", walk.id)
    .order("uploaded_at");
  const photos = (photoRows ?? []) as Photo[];

  // 1. Download every photo and recheck its fingerprint against the one saved at upload.
  const files = new Map<string, { bytes: Uint8Array; ok: boolean }>();
  for (let i = 0; i < photos.length; i += 6) {
    await Promise.all(
      photos.slice(i, i + 6).map(async (p) => {
        const { data } = await db.storage.from("evidence").download(p.storage_path);
        if (!data) return files.set(p.id, { bytes: new Uint8Array(), ok: false });
        const bytes = new Uint8Array(await data.arrayBuffer());
        const ok = createHash("sha256").update(bytes).digest("hex") === p.sha256;
        files.set(p.id, { bytes, ok });
      })
    );
  }
  const verifiedIds = photos.filter((p) => files.get(p.id)?.ok).map((p) => p.id);
  const failedIds = photos.filter((p) => !files.get(p.id)?.ok).map((p) => p.id);
  if (verifiedIds.length) await db.from("photos").update({ hash_verified: true }).in("id", verifiedIds);
  if (failedIds.length) await db.from("photos").update({ hash_verified: false }).in("id", failedIds);

  // 2. Build the PDF.
  const code = makeCode();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${KIND_LABELS[walk.kind]} condition report ${code}`);
  pdf.setCreator("MoveProof");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const newPage = () => { page = pdf.addPage([PAGE_W, PAGE_H]); y = PAGE_H - MARGIN; };
  const text = (s: string, size = 11, font = regular, color = INK) => {
    for (const line of wrap(s, font, size, PAGE_W - MARGIN * 2)) {
      if (y < MARGIN + 30) newPage();
      page.drawText(line, { x: MARGIN, y: y - size, size, font, color });
      y -= size + 5;
    }
  };
  const gap = (n = 10) => { y -= n; };

  // Cover page
  const home = walk.properties;
  text(`${KIND_LABELS[walk.kind]} condition report`, 22, bold);
  gap(6);
  text(address(home), 13);
  gap(14);
  text(`Prepared by: ${profile?.full_name || profile?.email || "Account holder"} (${home.role})`);
  if (walk.other_party_name) text(`Other party: ${walk.other_party_name}`);
  text(`Walkthrough started: ${stamp(walk.started_at)}`);
  text(`Walkthrough locked: ${stamp(walk.completed_at)}`);
  text(`Rooms: ${(rooms ?? []).length}    Photos: ${photos.length}    Fingerprints matched: ${verifiedIds.length} of ${photos.length}`);
  gap(14);
  text(`Verification code: ${code}`, 14, bold);
  text(`Check this PDF is unchanged at ${site}/verify/${code}`, 11, regular, SOFT);
  gap(14);
  text("How this report was made", 12, bold);
  text(
    "Each photo was given a SHA-256 fingerprint on the user's device and stamped with our server's clock when it was uploaded. " +
      "When the walkthrough was locked, its rooms and photos could no longer be edited or deleted. " +
      "When this report was created, every photo was downloaded again and its fingerprint compared with the one saved at upload. " +
      "Upload times show when each photo reached our servers, not necessarily when it was taken. " +
      "This report is a record of the photos and notes the user provided. It is not legal advice and does not decide any dispute.",
    10, regular, SOFT
  );
  if (walk.notes) { gap(10); text("Notes", 12, bold); text(walk.notes, 10); }

  // One section per room, two photos per page
  for (const room of (rooms ?? []) as Room[]) {
    newPage();
    text(room.name, 18, bold);
    text(`Condition: ${room.condition ? CONDITION_LABELS[room.condition] : "not marked"}`, 11, regular, SOFT);
    if (room.notes) text(`Notes: ${room.notes}`, 11);
    gap(8);
    const roomPhotos = photos.filter((p) => p.room_id === room.id);
    if (!roomPhotos.length) text("No photos taken in this room.", 11, regular, SOFT);

    for (const p of roomPhotos) {
      const file = files.get(p.id);
      const boxW = PAGE_W - MARGIN * 2, boxH = 250;
      if (y - boxH - 70 < MARGIN) newPage();
      if (file?.bytes.length) {
        const img = await pdf.embedJpg(file.bytes).catch(() => pdf.embedPng(file.bytes)).catch(() => null);
        if (img) {
          const scale = Math.min(boxW / img.width, boxH / img.height);
          const w = img.width * scale, h = img.height * scale;
          page.drawImage(img, { x: MARGIN, y: y - h, width: w, height: h });
          y -= h + 8;
        }
      }
      if (p.caption) text(p.caption, 10, bold);
      text(`Uploaded: ${stamp(p.uploaded_at)}    Phone clock: ${stamp(p.device_time)}`, 8, regular, SOFT);
      text(`SHA-256: ${p.sha256}`, 7, mono, SOFT);
      text(file?.ok ? "Fingerprint matches upload" : "FINGERPRINT DOES NOT MATCH UPLOAD", 8, bold, file?.ok ? SOFT : BAD);
      gap(14);
    }
  }

  // Footer on every page
  const pages = pdf.getPages();
  pages.forEach((pg, i) =>
    pg.drawText(clean(`Verify: ${site}/verify/${code}    Page ${i + 1} of ${pages.length}`), {
      x: MARGIN, y: 24, size: 8, font: regular, color: SOFT,
    })
  );

  const bytes = await pdf.save();
  const pdfSha = createHash("sha256").update(bytes).digest("hex");
  const path = `${user.id}/${walk.id}/${code}.pdf`;

  const { error: uploadError } = await db.storage.from("reports").upload(path, bytes, { contentType: "application/pdf" });
  if (uploadError) return NextResponse.json({ error: "Could not save the report." }, { status: 500 });

  await db.from("reports").insert({
    walkthrough_id: walk.id, owner_id: user.id, verify_code: code, pdf_path: path, pdf_sha256: pdfSha, photo_count: photos.length,
  });

  const { data: signed } = await db.storage.from("reports").createSignedUrl(path, 600, { download: `report-${code}.pdf` });
  return NextResponse.json({ url: signed?.signedUrl, verify_code: code });
}
