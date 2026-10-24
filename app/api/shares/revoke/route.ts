import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Body: { share_id }. Turns a link off for good; anyone opening it sees "no longer available".
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { share_id } = await req.json();
  const db = createAdminClient();
  const { error } = await db
    .from("shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", share_id)
    .eq("owner_id", user.id)
    .is("revoked_at", null);
  if (error) return NextResponse.json({ error: "Could not turn the link off." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
