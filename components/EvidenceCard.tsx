// The landing page's one memorable element: a photo "taped" into the record,
// with the exact proof details the app adds to every photo. Values are illustrative.
export default function EvidenceCard() {
  return (
    <figure className="relative mx-auto w-full max-w-sm rotate-1 bg-card p-4 pb-5 shadow-[0_1px_0_#d8dcd6,0_18px_40px_-24px_rgba(24,34,43,0.55)]">
      <div
        className="absolute -top-3 left-1/2 h-7 w-40 -translate-x-1/2 -rotate-3 bg-tape/90 px-3 py-1 text-center text-sm font-semibold"
        aria-hidden
      >
        Kitchen, move-out
      </div>
      {/* A drawn room corner stands in for a photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(to_bottom,#e6e2da_0_62%,#bfb39f_62%_100%)]">
        <div className="absolute inset-y-0 left-[38%] w-px bg-[#cfc9be]" />
        <div className="absolute bottom-[38%] left-[8%] h-[34%] w-[26%] border-[3px] border-[#a9a194] bg-[#d9d3c8]" />
        <div className="absolute right-[18%] top-[30%] h-10 w-14 rounded-full border-[3px] border-bad" />
      </div>
      <figcaption className="mt-3 space-y-1 font-mono text-xs text-soft">
        <p>Uploaded Oct 31, 2026, 4:12:09 PM</p>
        <p className="truncate">SHA-256 9f2c41d07be3a8e5…c1a71e</p>
        <p className="font-sans text-sm font-semibold text-ok">Locked. Fingerprint matches upload.</p>
      </figcaption>
    </figure>
  );
}
