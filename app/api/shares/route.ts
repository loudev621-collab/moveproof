import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canDownload } from "@/lib/access";
import { makeShareToken, shareUrl } from "@/lib/share";

export const runtime = "nodejs";

// Body: { walkthrough_id }. Creates a link the other party opens in any browser, no account needed.
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
    .select("id, owner_id, status, properties(role, paid)")
    .eq("id", walkthrough_id)
    .single();
  if (!walk || walk.owner_id !== user.id) return NextResponse.json({ error: "Walkthrough not found." }, { status: 404 });
  if (walk.status !== "completed") return NextResponse.json({ error: "Finish the walkthrough first." }, { status: 409 });

  const home = Array.isArray(walk.properties) ? walk.properties[0] : walk.properties;
  if (!canDownload(home)) return NextResponse.json({ error: "Payment needed." }, { status: 402 });

  const token = makeShareToken();
  const { error } = await db.from("shares").insert({ walkthrough_id: walk.id, owner_id: user.id, token });
  if (error) return NextResponse.json({ error: "Could not create the link. Try again." }, { status: 500 });

  return NextResponse.json({ url: shareUrl(token) });
}
