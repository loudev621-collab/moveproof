import { createClient } from "@/lib/supabase/server";
import { KIND_LABELS, when } from "@/lib/format";
import PdfCheck from "./PdfCheck";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("verify_report", { code });
  const report = Array.isArray(data) ? data[0] : null;

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <h1 className="text-3xl font-bold">Check a Doorstamp PDF</h1>
      <p className="mt-2 font-mono text-sm text-soft">Code {decodeURIComponent(code).toUpperCase()}</p>
      {!report ? (
        <p className="mt-8 border border-line bg-card p-5">
          No report has this code. Check it against the code printed on the PDF&apos;s first page.
        </p>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border border-line bg-card p-5">
            <dt className="text-soft">Type</dt><dd>{KIND_LABELS[report.kind]} report</dd>
            <dt className="text-soft">Created</dt><dd>{when(report.generated_at)}</dd>
            <dt className="text-soft">Photos</dt><dd>{report.photo_count}</dd>
          </dl>
          <PdfCheck expected={report.pdf_sha256} />
        </>
      )}
      <p className="mt-10 text-sm text-soft">
        This page confirms a PDF is the same file Doorstamp created. It doesn&apos;t judge what the photos show.
      </p>
    </div>
  );
}
