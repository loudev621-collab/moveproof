import Link from "next/link";
import EvidenceCard from "@/components/EvidenceCard";
import { FAQ } from "@/lib/faq";

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-5xl items-center gap-14 px-5 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Moving out? Protect your deposit in 15 minutes.
          </h1>
          <p className="mt-5 max-w-[33rem] text-lg text-soft">
            Walk room to room and take photos. Each one is timestamped and fingerprinted, the record locks
            when you finish, and you get one PDF to share if anyone questions the condition of the home.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="rounded-md bg-ink px-6 py-3.5 font-semibold text-card hover:bg-[#26333f]">
              Start a free walkthrough
            </Link>
            <span className="text-sm text-soft">Pay only when you download the report.</span>
          </div>
        </div>
        <EvidenceCard />
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-4">
            {[
              ["Add your home", "Address, and whether you're the renter or landlord."],
              ["Photo each room", "The checklist covers every room so nothing gets missed."],
              ["Finish and lock", "From here nothing can be changed, by anyone."],
              ["Share the report", "One PDF with times, fingerprints and a verify code."],
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

      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">For renters</h2>
          <p className="mt-3 text-soft">
            Record the scuffs and stains that were already there on move-in day, and show the clean
            apartment you left behind on move-out day.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold">For small landlords</h2>
          <p className="mt-3 text-soft">
            Consistent move-in and move-out records for every unit, ready to share with tenants, for less
            than a pizza a month.
          </p>
        </div>
      </section>

      <section id="pricing" className="border-y border-line bg-card">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-2xl font-bold">Pricing</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="border border-line p-6">
              <h3 className="font-semibold">Free</h3>
              <p className="mt-2 text-3xl font-bold">$0</p>
              <p className="mt-3 text-soft">Unlimited walkthroughs and photos.</p>
            </div>
            <div className="border-2 border-ink p-6">
              <h3 className="font-semibold">Home Pass, for renters</h3>
              <p className="mt-2 text-3xl font-bold">$9 <span className="text-base font-normal text-soft">once</span></p>
              <p className="mt-3 text-soft">Every report for one address, move-in and move-out.</p>
            </div>
            <div className="border border-line p-6">
              <h3 className="font-semibold">Landlord</h3>
              <p className="mt-2 text-3xl font-bold">$15 <span className="text-base font-normal text-soft">a month</span></p>
              <p className="mt-3 text-soft">Reports for all your rentals. Cancel anytime.</p>
            </div>
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
