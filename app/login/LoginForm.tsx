"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Google and Apple show only when set to "on" in .env.local / Vercel. Email always works.
const GOOGLE_ON = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "on";
const APPLE_ON = process.env.NEXT_PUBLIC_AUTH_APPLE === "on";

export default function LoginForm() {
  const params = useSearchParams();
  const raw = params.get("next") ?? "/dashboard";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function withProvider(provider: "google" | "apple") {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
    if (error) setError(error.message);
  }

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setBusy(false);
    if (error) {
      console.error("Send sign-in email failed:", error);
      setError(error.message);
    } else setSent(true);
  }

  // Typing the code signs in right here, so it works even if the email opens in another app.
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) {
      console.error("Verify sign-in code failed:", error);
      return setError("That code didn't work. Check it, or request a new one.");
    }
    window.location.href = next;
  }

  const button = "w-full rounded-md border border-ink bg-card px-4 py-3 font-semibold";
  const field = "w-full rounded-md border border-line bg-card px-3 py-3";

  if (sent) {
    return (
      <div className="mt-8 space-y-4">
        <p className="border border-line bg-card p-4">
          We sent an email to <strong>{email}</strong>. Click the link in it, <strong>or</strong> type the code below.
        </p>
        <form onSubmit={verifyCode} className="space-y-3">
          <label htmlFor="code" className="block text-sm font-semibold">Code from the email</label>
          <input
            id="code" inputMode="numeric" autoComplete="one-time-code" required
            pattern="[0-9]{6,8}" maxLength={8} value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${field} text-center font-mono text-2xl tracking-widest`}
          />
          <button disabled={busy} className="w-full rounded-md bg-ink px-4 py-3 font-semibold text-card disabled:opacity-60">
            {busy ? "Checking…" : "Sign in with code"}
          </button>
        </form>
        <button onClick={() => { setSent(false); setCode(""); }} className="text-sm underline">
          Use a different email or send a new code
        </button>
        {error && <p className="text-sm text-bad">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {GOOGLE_ON && <button className={button} onClick={() => withProvider("google")}>Continue with Google</button>}
      {APPLE_ON && <button className={button} onClick={() => withProvider("apple")}>Continue with Apple</button>}
      {(GOOGLE_ON || APPLE_ON) && <p className="py-2 text-center text-sm text-soft">or sign in with email</p>}
      <form onSubmit={sendEmail} className="space-y-3">
        <label htmlFor="email" className="block text-sm font-semibold">Email</label>
        <input id="email" type="email" required autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} className={field} />
        <button disabled={busy} className="w-full rounded-md bg-ink px-4 py-3 font-semibold text-card disabled:opacity-60">
          {busy ? "Sending…" : "Email me a sign-in link and code"}
        </button>
      </form>
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}
