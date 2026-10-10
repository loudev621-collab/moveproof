"use client";

import { useState } from "react";

export default function BillingButton({ hasBilling, landlord }: { hasBilling: boolean; landlord: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const data = await res.json();
    if (res.ok && data.url) window.location.href = data.url;
    else { setError(data.error ?? "Something went wrong."); setBusy(false); }
  }

  return (
    <div className="space-y-3">
      {landlord && hasBilling ? (
        <button onClick={() => go("/api/billing-portal")} disabled={busy} className="w-full rounded-md border border-ink bg-card px-4 py-3 font-semibold">
          {busy ? "Opening…" : "Manage billing or cancel"}
        </button>
      ) : (
        <button onClick={() => go("/api/checkout", { plan: "landlord", return_to: "/account" })} disabled={busy}
          className="w-full rounded-md bg-ink px-4 py-3 font-semibold text-card">
          {busy ? "Opening payment…" : "Start Landlord plan, $15 a month"}
        </button>
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}
