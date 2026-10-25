"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Google and Apple buttons only show once they're turned on in Supabase
// AND set to "on" in .env.local / Vercel. Email links always work.
const GOOGLE_ON = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "on";
const APPLE_ON = process.env.NEXT_PUBLIC_AUTH_APPLE === "on";

export default function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function withProvider(provider: "google" | "apple") {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
    if (error) setError(error.message);
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return <p className="mt-8 border border-line bg-card p-4">Check {email} for a sign-in link. You can close this tab.</p>;
  }

  const button = "w-full rounded-md border border-ink bg-card px-4 py-3 font-semibold";
  return (
    <div className="mt-8 space-y-3">
      {GOOGLE_ON && <button className={button} onClick={() => withProvider("google")}>Continue with Google</button>}
      {APPLE_ON && <button className={button} onClick={() => withProvider("apple")}>Continue with Apple</button>}
      {(GOOGLE_ON || APPLE_ON) && <p className="py-2 text-center text-sm text-soft">or get a link by email</p>}
      <form onSubmit={withEmail} className="space-y-3">
        <label htmlFor="email" className="block text-sm font-semibold">Email</label>
        <input
          id="email" type="email" required autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-line bg-card px-3 py-3"
        />
        <button className="w-full rounded-md bg-ink px-4 py-3 font-semibold text-card">Email me a sign-in link</button>
      </form>
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}