"use client";

import { useState } from "react";
import { downloadBlob } from "@/lib/download";
import { resumeFileBase } from "@/lib/resume/io";
import type { EditorDocument } from "@/lib/resume/types";

/** Builds the PDF in the browser. react-pdf and the fonts load only on first click. */
export async function renderResumePdf(doc: EditorDocument): Promise<Blob> {
  const [{ pdf }, { ResumeDocument }, { registerPdfFonts }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ResumeDocument"),
    import("./fonts"),
  ]);
  registerPdfFonts(`${window.location.origin}/fonts`);
  return pdf(<ResumeDocument resume={doc.resume} settings={doc.settings} />).toBlob();
}

export function DownloadPdfButton({ doc }: { doc: EditorDocument }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await renderResumePdf(doc);
      downloadBlob(blob, `${resumeFileBase(doc.resume.basics.fullName)}.pdf`);
    } catch {
      setError("The PDF couldn't be created. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={download}
        disabled={busy}
        aria-busy={busy}
        className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-marker)] disabled:opacity-60"
      >
        {busy ? "Creating PDF…" : "Download PDF"}
      </button>
    </div>
  );
}
