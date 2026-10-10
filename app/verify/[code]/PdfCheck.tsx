"use client";

import { useState } from "react";
import { sha256Hex } from "@/lib/browser";

// The file is checked inside the visitor's own browser; it is never uploaded.
export default function PdfCheck({ expected }: { expected: string }) {
  const [result, setResult] = useState<"match" | "differs" | null>(null);
  const [checking, setChecking] = useState(false);

  async function check(file: File | undefined) {
    if (!file) return;
    setChecking(true);
    setResult((await sha256Hex(file)) === expected ? "match" : "differs");
    setChecking(false);
  }

  return (
    <div className="mt-6">
      <label
        className="flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-line bg-card px-4 py-10 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); check(e.dataTransfer.files[0]); }}
      >
        <span className="font-semibold">{checking ? "Checking…" : "Drop the PDF here or choose it"}</span>
        <span className="mt-1 text-sm text-soft">Your file stays on your device.</span>
        <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => check(e.target.files?.[0])} />
      </label>
      {result === "match" && (
        <p className="mt-4 border-l-4 border-ok bg-card p-4 font-semibold text-ok">This PDF is unchanged since MoveProof created it.</p>
      )}
      {result === "differs" && (
        <p className="mt-4 border-l-4 border-bad bg-card p-4 font-semibold text-bad">
          This file is different from the original report. Ask the sender for the original PDF.
        </p>
      )}
    </div>
  );
}
