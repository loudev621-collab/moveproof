"use client";

import { useState } from "react";
import { MOVE_PASS_PRICE } from "@/lib/brand";

export default function ReportActions({ walkthroughId, propertyId, allowed }: {
  walkthroughId: string; propertyId: string; allowed: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const returnTo = `/walkthrough/${walkthroughId}/report`;

  async function post(path: string, body: unknown, label: string) {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong.");
      window.location.href = data.url;
      if (path === "/api/reports") setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  if (allowed) {
    return (
      <div>
        <button onClick={() => post("/api/reports", { walkthrough_id: walkthroughId }, "pdf")} disabled={!!busy}
          className="w-full rounded-md border border-ink bg-card px-4 py-4 text-lg font-semibold disabled:opacity-60">
          {busy ? "Building your PDF… this can take a minute" : "Create PDF report"}
        </button>
        {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-semibold">Your walkthrough is saved and locked.</p>
      <p className="text-soft">
        One Move Pass covers this home&apos;s move-in and move-out records: share links and PDFs. No subscription.
      </p>
      <button onClick={() => post("/api/checkout", { plan: "move_pass", property_id: propertyId, return_to: returnTo }, "pass")}
        disabled={!!busy} className="w-full rounded-md bg-ink px-4 py-4 text-lg font-semibold text-card disabled:opacity-60">
        {busy ? "Opening payment…" : `Get the Move Pass, ${MOVE_PASS_PRICE} once`}
      </button>
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}
