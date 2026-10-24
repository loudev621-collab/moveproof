"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

// The person who received the link types their name to confirm they received and viewed the record.
export async function acknowledge(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!token || token.length < 32) redirect("/");
  if (!name) redirect(`/r/${token}?ack=missing`);

  const db = createAdminClient();
  await db
    .from("shares")
    .update({ acknowledged_at: new Date().toISOString(), ack_name: name, ack_note: note || null })
    .eq("token", token)
    .is("revoked_at", null)
    .is("acknowledged_at", null);

  redirect(`/r/${token}`);
}
