"use client";

import Link from "next/link";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { JobMatchPanel } from "@/components/match/JobMatchPanel";
import { DownloadPdfButton } from "@/components/pdf/DownloadPdfButton";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { siteConfig } from "@/lib/site";
import { useEditor, type SaveState } from "@/state/ResumeProvider";
import { BasicsForm } from "./BasicsForm";
import { EducationForm } from "./EducationForm";
import { ExperienceForm } from "./ExperienceForm";
import { ProjectsForm } from "./ProjectsForm";
import { SkillsForm } from "./SkillsForm";
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

const TABS = [
  { id: "resume", label: "Resume" },
  { id: "match", label: "Match a job" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function EditorTabs({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = TABS.findIndex((tab) => tab.id === active);
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label="Editor" className="mb-6 flex gap-1 border-b border-rule" onKeyDown={onKeyDown}>
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-marker)] ${
              selected ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function ResumeEditor({ toolbar }: { toolbar?: ReactNode }) {
  const { doc, status, saveState } = useEditor();
  const [tab, setTab] = useState<TabId>("resume");

  return (
    <div className="flex min-h-dvh flex-col bg-desk">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-panel/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
          {siteConfig.name}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {status === "ready" ? <SaveIndicator state={saveState} /> : null}
          {toolbar}
          {status === "ready" ? <DownloadPdfButton doc={doc} /> : null}
        </div>
      </header>

      {status === "loading" ? (
        <p className="p-8 text-sm text-ink-soft">Loading your resume…</p>
      ) : (
        <main className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="border-rule bg-panel px-4 py-6 sm:px-8 lg:border-r">
            <div className="mx-auto max-w-2xl">
              <EditorTabs active={tab} onChange={setTab} />
              {/* Both panels stay mounted so match results survive switching tabs. */}
              <div
                id="panel-resume"
                role="tabpanel"
                aria-labelledby="tab-resume"
                hidden={tab !== "resume"}
                className="flex flex-col gap-8"
              >
                <BasicsForm />
                <SummaryForm />
                <ExperienceForm />
                <EducationForm />
                <SkillsForm />
                <ProjectsForm />
              </div>
              <div id="panel-match" role="tabpanel" aria-labelledby="tab-match" hidden={tab !== "match"}>
                <JobMatchPanel />
              </div>
            </div>
          </div>
          <div className="px-4 py-6 sm:px-8 lg:py-0">
            <div className="lg:sticky lg:top-[57px] lg:max-h-[calc(100dvh-57px)] lg:overflow-y-auto lg:py-6">
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
