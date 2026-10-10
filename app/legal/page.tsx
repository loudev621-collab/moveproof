// DRAFT TEXT: have an attorney review before launch.
export default function LegalPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 px-5 py-12">
      <h1 className="text-3xl font-bold">Terms, privacy and what reports prove</h1>
      <section>
        <h2 className="text-xl font-bold">What a report is</h2>
        <p className="mt-2">
          A MoveProof report is a record of the photos and notes you provided. It shows when each photo reached
          our servers and that the photos and report have not changed since. It does not show when a photo was
          taken, and it is not legal advice. MoveProof is not a party to any dispute and does not guarantee any
          outcome.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Your photos</h2>
        <p className="mt-2">
          You own your photos. We store them privately so only you can see them unless you share a report.
          Please photograph rooms, not people or personal documents. We never sell your data.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Locked walkthroughs</h2>
        <p className="mt-2">
          After you lock a walkthrough, its photos and notes cannot be edited or deleted. You can ask us to
          delete your account; reports you have already shared with others remain with them.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Payments and refunds</h2>
        <p className="mt-2">
          Home Pass is a one-time payment for one address. The Landlord plan renews monthly until you cancel in
          Account. Contact us within 14 days if something went wrong and we will make it right.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Deposit rules</h2>
        <p className="mt-2">
          Each state has its own rules on security deposits. Check your state's official tenant and landlord
          information page or ask a local tenant organization or attorney.
        </p>
      </section>
    </article>
  );
}
