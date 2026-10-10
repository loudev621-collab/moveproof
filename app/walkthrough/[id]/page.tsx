import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Capture from "./Capture";

export default async function WalkthroughPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: walk } = await supabase.from("walkthroughs").select("*, properties(nickname)").eq("id", id).maybeSingle();
  if (!walk || !user) notFound();
  if (walk.status === "completed") redirect(`/walkthrough/${id}/report`);

  const { data: rooms } = await supabase.from("rooms").select("*").eq("walkthrough_id", id).order("position");
  const { data: photos } = await supabase.from("photos").select("*").eq("walkthrough_id", id).order("uploaded_at");

  const paths = (photos ?? []).map((p) => p.storage_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from("evidence").createSignedUrls(paths, 3600)
    : { data: [] as { signedUrl: string }[] };

  return (
    <Capture
      userId={user.id}
      walkthrough={walk}
      initialRooms={rooms ?? []}
      initialPhotos={(photos ?? []).map((p, i) => ({ ...p, preview: signed?.[i]?.signedUrl ?? null }))}
    />
  );
}
