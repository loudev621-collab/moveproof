import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-line bg-card">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="inline-block h-4 w-6 -rotate-6 bg-tape" aria-hidden />
          Doorstamp
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/#pricing" className="hidden sm:inline">Pricing</Link>
          <Link href="/#faq" className="hidden sm:inline">Questions</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="font-semibold">My homes</Link>
              <Link href="/account" className="hidden sm:inline">Account</Link>
              <form action="/auth/signout" method="post">
                <button className="text-soft underline">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="font-semibold">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
