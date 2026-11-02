import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/lib/faq";

const SUPPORT_EMAIL = "support@doorstamp.com";

export const metadata: Metadata = { title: "Help and contact | Doorstamp" };

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold">Help</h1>
      <p className="mt-3 text-soft">
        Stuck, found a bug, or need a refund? Email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline">{SUPPORT_EMAIL}</a>.
        We reply within one business day. Include the home&apos;s address and a screenshot if you can.
      </p>
      <h2 className="mt-10 text-xl font-bold">Common questions</h2>
      <div className="mt-4 divide-y divide-line">
        {FAQ.map((f) => (
          <div key={f.q} className="py-4">
            <p className="font-semibold">{f.q}</p>
            <p className="mt-1 text-soft">{f.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-soft">
        Terms, privacy and refunds: <Link href="/legal" className="underline">read them here</Link>.
      </p>
    </div>
  );
}
