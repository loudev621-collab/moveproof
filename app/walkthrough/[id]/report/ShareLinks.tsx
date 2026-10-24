"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { when } from "@/lib/format";
import { NO_APP } from "@/lib/brand";

type Share = {
  id: string; url: string; created_at: string; revoked_at: string | null; first_viewed_at: string | null;
  view_count: number; acknowledged_at: string | null; ack_name: string | null; ack_note: string | null;
};

export default function ShareLinks({ walkthroughId, shares }: { walkthroughId: string; shares: Share[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    if (data.url) await copy(data.url, "new");
    router.refresh();
  }

  async function copy(url: string, id: string) {
    try {
      if (navigator.share && /Mobi/i.test(navigator.userAgent)) await navigator.share({ title: "Doorstamp record", url });
      else await navigator.clipboard.writeText(url);
      setCopied(id);
    } catch {
      // The person closed the share sheet; nothing to do.
    }
  }

  const active = shares.filter((s) => !s.revoked_at);

  return (
    <section className="mt-8 border-2 border-ink bg-card p-5">
      <h2 className="text-xl font-bold">Send a link</h2>
      <p className="mt-1 text-soft">{NO_APP}. They open it in any browser, no account needed, and can acknowledge they received it.</p>
      <button onClick={() => call("/api/shares", { walkthrough_id: walkthroughId })} disabled={busy}
        className="mt-4 w-full rounded-md bg-ink px-4 py-4 text-lg font-semibold text-card disabled:opacity-60">
        {busy ? "Creating…" : copied === "new" ? "Link copied. Create another" : "Create and copy share link"}
      </button>
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}

      {active.length > 0 && (
        <ul className="mt-5 space-y-3">
          {active.map((s) => (
            <li key={s.id} className="border border-line p-3 text-sm">
              <p className="break-all font-mono text-xs">{s.url}</p>
              <p className="mt-2 text-soft">
                Created {when(s.created_at)}.{" "}
                {s.first_viewed_at ? `Opened ${s.view_count} time${s.view_count === 1 ? "" : "s"}, first ${when(s.first_viewed_at)}.` : "Not opened yet."}
              </p>
              {s.acknowledged_at && (
                <p className="mt-1 font-semibold text-ok">
                  Acknowledged by {s.ack_name} on {when(s.acknowledged_at)}{s.ack_note ? `: "${s.ack_note}"` : "."}
                </p>
              )}
              <div className="mt-2 flex gap-4">
                <button onClick={() => copy(s.url, s.id)} className="font-semibold underline">{copied === s.id ? "Copied" : "Copy"}</button>
                <button onClick={() => confirm("Turn this link off? Anyone opening it will see it's no longer available.") && call("/api/shares/revoke", { share_id: s.id })}
                  className="text-soft underline">Turn off</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
