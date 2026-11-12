"use client";

import { useEffect, useRef, useState } from "react";
import { TextAreaField } from "@/components/editor/fields";
import { ApiError, MAX_JOB_DESCRIPTION_CHARS, scoreResume, type ScoreResult } from "@/lib/api";
import { useEditor } from "@/state/ResumeProvider";
import { MatchResults } from "./MatchResults";

/** After this long without an answer, explain that the free server may be waking up. */
const SLOW_REQUEST_MS = 5_000;

type Check =
  | { state: "idle" }
  | { state: "loading"; slow: boolean }
  | { state: "error"; message: string }
  | { state: "done"; result: ScoreResult; snapshot: string };

export function JobMatchPanel() {
  const { doc, dispatch } = useEditor();
  const [check, setCheck] = useState<Check>({ state: "idle" });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const jobDescription = doc.jobDescription;
  const snapshot = JSON.stringify([doc.resume, jobDescription]);
  const tooLong = jobDescription.length > MAX_JOB_DESCRIPTION_CHARS;
  const canCheck = jobDescription.trim().length > 0 && !tooLong && check.state !== "loading";

  const runCheck = async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    const slowTimer = setTimeout(() => setCheck({ state: "loading", slow: true }), SLOW_REQUEST_MS);
    setCheck({ state: "loading", slow: false });
    try {
      const result = await scoreResume(doc.resume, jobDescription, current.signal);
      setCheck({ state: "done", result, snapshot });
    } catch (error) {
      if (current.signal.aborted) return;
      const message =
        error instanceof ApiError ? error.message : "Something went wrong while checking. Try again.";
      setCheck({ state: "error", message });
    } finally {
      clearTimeout(slowTimer);
    }
  };

  return (
    <section className="flex flex-col gap-5" aria-label="Job match">
      <header>
        <h2 className="text-lg font-semibold text-ink">Match a job</h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          Paste a job posting to see which of its keywords your resume covers and what to improve.
        </p>
      </header>

      <TextAreaField
        label="Job description"
        value={jobDescription}
        rows={10}
        placeholder="Paste the full job posting, including requirements…"
        onChange={(value) => dispatch({ type: "setJobDescription", value })}
        hint={
          tooLong
            ? `Too long: ${jobDescription.length.toLocaleString()} of ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters.`
            : `${jobDescription.length.toLocaleString()} / ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters`
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runCheck}
          disabled={!canCheck}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-marker)] disabled:opacity-50"
        >
          {check.state === "loading" ? "Checking…" : check.state === "done" ? "Check again" : "Check match"}
        </button>
        {check.state === "done" && check.snapshot !== snapshot ? (
          <p className="text-sm text-ink-soft">Your resume or the job description changed since this check.</p>
        ) : null}
      </div>

      <div aria-live="polite">
        {check.state === "loading" && check.slow ? (
          <p className="rounded-md bg-desk p-3 text-sm text-ink">
            The scoring server is starting up. On free hosting this can take up to a minute after it has been idle.
          </p>
        ) : null}
        {check.state === "error" ? (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {check.message}
          </p>
        ) : null}
      </div>

      {check.state === "done" ? <MatchResults result={check.result} /> : null}
    </section>
  );
}
