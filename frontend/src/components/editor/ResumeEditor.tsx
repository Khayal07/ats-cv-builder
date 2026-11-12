"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { siteConfig } from "@/lib/site";
import { useEditor, type SaveState } from "@/state/ResumeProvider";
import { BasicsForm } from "./BasicsForm";
import { SummaryForm } from "./SummaryForm";

const saveLabels: Record<SaveState, string> = {
  saved: "Saved in this browser",
  saving: "Saving…",
  error: "Not saved: browser storage is unavailable",
};

function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <p
      role="status"
      className={`font-mono text-[11px] uppercase tracking-[0.08em] ${state === "error" ? "text-red-700" : "text-ink-soft"}`}
    >
      {saveLabels[state]}
    </p>
  );
}

export function ResumeEditor({ toolbar }: { toolbar?: ReactNode }) {
  const { doc, status, saveState } = useEditor();

  return (
    <div className="flex min-h-dvh flex-col bg-desk">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-panel/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
          {siteConfig.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {status === "ready" ? <SaveIndicator state={saveState} /> : null}
          {toolbar}
        </div>
      </header>

      {status === "loading" ? (
        <p className="p-8 text-sm text-ink-soft">Loading your resume…</p>
      ) : (
        <main className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="border-rule bg-panel px-4 py-6 sm:px-8 lg:border-r">
            <div className="mx-auto flex max-w-2xl flex-col gap-8">
              <BasicsForm />
              <SummaryForm />
            </div>
          </div>
          <div className="px-4 py-6 sm:px-8">
            <div className="lg:sticky lg:top-20">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                Preview · {doc.settings.pageSize === "A4" ? "A4" : "US Letter"}
              </p>
              <ResumePreview resume={doc.resume} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
