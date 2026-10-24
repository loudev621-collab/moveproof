import Link from "next/link";
import EvidenceCard from "@/components/EvidenceCard";
import { FAQ } from "@/lib/faq";
import { AB2801_STEPS, AB2801_URL } from "@/lib/california";
import { MOVE_PASS_PRICE, NO_APP } from "@/lib/brand";

export default function Home() {
  return (
    <>
      {/* 1. California first */}
      <section className="mx-auto grid max-w-5xl items-center gap-14 px-5 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <p className="inline-block -rotate-2 bg-tape px-2 text-sm font-bold">For California renters and small landlords</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            The AB 2801 move-in/move-out photo record.
          </h1>
          <p className="mt-5 max-w-[33rem] text-lg text-soft">
            California landlords now need move-in and move-out photos to deduct from a deposit. Doorstamp makes
            that record in about 15 minutes: room by room, timestamped, locked, and easy for both sides to open.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="rounded-md bg-ink px-6 py-3.5 font-semibold text-card hover:bg-[#26333f]">
              Start free in your browser
            </Link>
            <span className="text-sm font-semibold">{NO_APP}.</span>
          </div>
        </div>
        <EvidenceCard />
      </section>

      {/* 2. No app to download */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-2xl font-bold">{NO_APP}. For anyone.</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              ["Open it on your phone", "Works in any phone browser. Nothing to install."],
              ["Photo each room", "The checklist covers every room. The record locks when you finish."],
              ["Send one link", "The landlord or tenant opens it in their browser. No app, no account."],
            ].map(([title, body], i) => (
              <li key={title}>
                <p className="inline-block -rotate-3 bg-tape px-2 font-bold">{i + 1}</p>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-soft">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* AB 2801, built around it */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-2xl font-bold">Built around AB 2801&apos;s three photo steps</h2>
        <p className="mt-3 max-w-2xl text-soft">
          Each step is its own walkthrough in Doorstamp, and each record is titled for California.
        </p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {AB2801_STEPS.map((s, i) => (
            <li key={s.kind} className="border border-line bg-card p-5">
              <p className="font-mono text-sm text-soft">Step {i + 1}</p>
              <h3 className="mt-1 font-semibold">{s.label}</h3>
              <p className="mt-2 text-soft">{s.when}.</p>
              <p className="mt-2 text-sm text-soft">{s.since}.</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-soft">
          Plain-language summary of Civil Code §1950.5, not legal advice.{" "}
          <a href={AB2801_URL} className="underline" target="_blank" rel="noreferrer">Read AB 2801</a>.
        </p>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">For renters</h2>
            <p className="mt-3 text-soft">
              Your landlord takes photos; take your own too. Record the scuffs that were already there on
              move-in day and the clean home you left on move-out day, then send your landlord the link.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">For small landlords: free</h2>
            <p className="mt-3 text-soft">
              Move-in, move-out and after-repair records for every unit, at no cost. Send each tenant the
              link; they open it without installing anything.
            </p>
            <Link href="/properties/new?role=landlord" className="mt-4 inline-block font-semibold underline">
              Add a rental, free
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Price per move */}
      <section id="pricing" className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-2xl font-bold">Pay per move. No subscription.</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="border-2 border-ink bg-card p-6">
            <h3 className="font-semibold">Move Pass, for renters</h3>
            <p className="mt-2 text-3xl font-bold">
              {MOVE_PASS_PRICE} <span className="text-base font-normal text-soft">once per address</span>
            </p>
            <ul className="mt-3 space-y-1 text-soft">
              <li>Move-in and move-out records for one home</li>
              <li>PDF reports and share links</li>
              <li>Taking photos is always free; pay only to send</li>
            </ul>
          </div>
          <div className="border border-line bg-card p-6">
            <h3 className="font-semibold">Landlords</h3>
            <p className="mt-2 text-3xl font-bold">Free</p>
            <ul className="mt-3 space-y-1 text-soft">
              <li>Every unit, every walkthrough</li>
              <li>Move-in, move-out and after-repair records</li>
              <li>PDF reports and share links</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-5 py-14">
        <h2 className="text-2xl font-bold">Questions</h2>
        <div className="mt-6 divide-y divide-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none font-semibold">
                <span className="mr-2 inline-block text-soft transition-transform group-open:rotate-90">›</span>
                {f.q}
              </summary>
              <p className="mt-2 pl-5 text-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
