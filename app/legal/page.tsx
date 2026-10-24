import { AB2801_URL } from "@/lib/california";

// DRAFT TEXT: have an attorney review before launch.
export default function LegalPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 px-5 py-12">
      <h1 className="text-3xl font-bold">Terms, privacy and what records show</h1>
      <section>
        <h2 className="text-xl font-bold">What a record is</h2>
        <p className="mt-2">
          A Doorstamp record is a set of the photos and notes you provided. It shows when each photo reached our
          servers and that the photos and PDF have not changed since. It does not show when a photo was taken,
          and it is not legal advice. Doorstamp is not a party to any disagreement and does not promise any outcome.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">California AB 2801</h2>
        <p className="mt-2">
          Records for California homes are titled and organized around the photo steps in Civil Code §1950.5 as
          changed by <a href={AB2801_URL} className="underline">AB 2801</a>. Those duties fall on landlords. Our
          summary is for convenience only; using Doorstamp does not by itself meet any legal requirement. Check
          the law or ask a local tenant organization or attorney.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Share links</h2>
        <p className="mt-2">
          Anyone with a share link can view that record, including the home&apos;s address, until you turn the
          link off. Only send it to people who should see it. When someone acknowledges a record, we save the
          name and note they typed and the time; it means they received it, not that they agree with it.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Your photos</h2>
        <p className="mt-2">
          You own your photos. We store them privately. Please photograph rooms, not people or personal
          documents. We never sell your data.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Locked walkthroughs</h2>
        <p className="mt-2">
          After you lock a walkthrough, its photos and notes cannot be edited or deleted. You can ask us to
          delete your account; records you have already shared remain with the people you sent them to.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Payments and refunds</h2>
        <p className="mt-2">
          The Move Pass is a one-time payment for one address. It covers that home&apos;s move-in and move-out
          records, PDFs and share links. There is no subscription. Landlord accounts are free. Contact us within
          14 days if something went wrong and we will make it right.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Other states</h2>
        <p className="mt-2">
          Each state has its own security deposit rules. Check your state&apos;s official tenant and landlord
          information page or ask a local tenant organization or attorney.
        </p>
      </section>
    </article>
  );
}
