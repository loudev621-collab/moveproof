import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canDownload } from "@/lib/access";
import { KIND_LABELS, address, when } from "@/lib/format";
import ReportActions from "./ReportActions";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: walk } = await supabase.from("walkthroughs").select("*, properties(*)").eq("id", id).maybeSingle();
  if (!walk || !user) notFound();
  if (walk.status !== "completed") redirect(`/walkthrough/${id}`);

  const { data: profile } = await supabase.from("profiles").select("plan, plan_status").eq("id", user.id).single();
  const { data: rooms } = await supabase.from("rooms").select("id, name, photos(count)").eq("walkthrough_id", id).order("position");
  const { data: reports } = await supabase
    .from("reports")
    .select("id, verify_code, pdf_path, generated_at")
    .eq("walkthrough_id", id)
    .order("generated_at", { ascending: false });

  const links = await Promise.all(
    (reports ?? []).map(async (r) => {
      const { data } = await supabase.storage.from("reports").createSignedUrl(r.pdf_path, 600, { download: `report-${r.verify_code}.pdf` });
      return { ...r, url: data?.signedUrl ?? null };
    })
  );

  const allowed = canDownload(profile, walk.properties);
  const totalPhotos = (rooms ?? []).reduce((n, r) => n + (r.photos?.[0]?.count ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link href={`/properties/${walk.property_id}`} className="text-sm underline">{walk.properties.nickname}</Link>
      <h1 className="mt-2 text-3xl font-bold">{KIND_LABELS[walk.kind]} report</h1>
      <p className="text-soft">{address(walk.properties)}</p>
      <p className="mt-3 text-sm font-semibold text-ok">Locked {when(walk.completed_at)}. Nothing in this walkthrough can change.</p>

      {paid && !allowed && (
        <p className="mt-6 border border-line bg-card p-4 text-sm">
          Payment received. It can take a few seconds to unlock; refresh this page if the button doesn&apos;t appear.
        </p>
      )}

      <ul className="mt-6 divide-y divide-line border border-line bg-card">
        {(rooms ?? []).map((r) => (
          <li key={r.id} className="flex justify-between p-3">
            <span>{r.name}</span>
            <span className="text-soft">{r.photos?.[0]?.count ?? 0} photos</span>
          </li>
        ))}
        <li className="flex justify-between p-3 font-semibold">
          <span>Total</span>
          <span>{totalPhotos} photos</span>
        </li>
      </ul>

      <div className="mt-8">
        <ReportActions
          walkthroughId={id}
          propertyId={walk.property_id}
          allowed={allowed}
          role={walk.properties.role}
        />
      </div>

      {links.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Reports created</h2>
          <ul className="mt-3 space-y-2">
            {links.map((r) => (
              <li key={r.id} className="flex items-center justify-between border border-line bg-card p-3 text-sm">
                <span>
                  {when(r.generated_at)}, code <span className="font-mono">{r.verify_code}</span>
                </span>
                {r.url && <a href={r.url} className="font-semibold underline">Download</a>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-soft">
            Anyone you share a report with can check it at {process.env.NEXT_PUBLIC_SITE_URL}/verify/your-code.
          </p>
        </section>
      )}
    </div>
  );
}
