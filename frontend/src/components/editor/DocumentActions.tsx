"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { downloadBlob } from "@/lib/download";
import { parseImportedJson, resumeFileBase, serializeDocument } from "@/lib/resume/io";
import { defaultDocument } from "@/lib/resume/migrate";
import { sampleResume } from "@/lib/resume/sample";
import { visibleSections } from "@/lib/resume/view";
import { useEditor } from "@/state/ResumeProvider";

const MAX_IMPORT_BYTES = 1_000_000;

function ToolbarButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-desk hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-marker)]"
    >
      {children}
    </button>
  );
}

/** Load sample, import/export JSON and reset for the current document. */
export function DocumentActions() {
  const { doc, dispatch } = useEditor();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasContent =
    visibleSections(doc.resume).length > 0 || doc.resume.basics.fullName.trim().length > 0;

  const confirmReplace = (action: string) =>
    !hasContent || window.confirm(`${action} replaces your current resume. Continue?`);

  const loadSample = () => {
    if (!confirmReplace("Loading the sample")) return;
    dispatch({ type: "replaceResume", resume: sampleResume() });
    setMessage(null);
  };

  const reset = () => {
    if (!hasContent || !window.confirm("Clear every field and start over?")) return;
    dispatch({ type: "replaceDocument", doc: defaultDocument() });
    setMessage(null);
  };

  const exportJson = () => {
    const blob = new Blob([serializeDocument(doc)], { type: "application/json" });
    downloadBlob(blob, `${resumeFileBase(doc.resume.basics.fullName)}.json`);
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage("That file is larger than 1 MB. Choose a resume JSON exported from this app.");
      return;
    }
    const imported = parseImportedJson(await file.text());
    if (!imported) {
      setMessage("That file isn't a resume JSON. Choose a file exported from this app.");
      return;
    }
    if (!confirmReplace("Importing")) return;
    dispatch({ type: "replaceDocument", doc: imported });
    setMessage(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <ToolbarButton onClick={loadSample}>Load sample</ToolbarButton>
      <ToolbarButton onClick={() => fileInput.current?.click()}>Import JSON</ToolbarButton>
      <ToolbarButton onClick={exportJson}>Export JSON</ToolbarButton>
      <ToolbarButton onClick={reset}>Clear</ToolbarButton>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Import resume JSON file"
        onChange={importJson}
      />
      {message ? (
        <p role="alert" className="basis-full text-right text-sm text-red-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
