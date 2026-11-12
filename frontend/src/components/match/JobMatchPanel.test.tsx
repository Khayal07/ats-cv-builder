// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ScoreResult } from "@/lib/api";
import { defaultDocument } from "@/lib/resume/migrate";
import { sampleResume } from "@/lib/resume/sample";
import { ResumeProvider } from "@/state/ResumeProvider";
import { memoryAdapter } from "@/test/memoryAdapter";
import { JobMatchPanel } from "./JobMatchPanel";

const RESULT: ScoreResult = {
  score: 67,
  matched: [{ term: "Python", weight: 4, category: "skill", sections: ["summary", "skills"] }],
  missing: [{ term: "Kubernetes", weight: 2, category: "skill" }],
  suggestions: [
    { type: "missing_keyword", severity: "medium", message: 'Add "Kubernetes" if you have used it.', term: "Kubernetes" },
  ],
};

afterEach(() => vi.unstubAllGlobals());

async function setup() {
  const user = userEvent.setup();
  const doc = { ...defaultDocument(), resume: sampleResume() };
  render(
    <ResumeProvider adapter={memoryAdapter(doc)} saveDelayMs={0}>
      <JobMatchPanel />
    </ResumeProvider>,
  );
  const textarea = await screen.findByLabelText("Job description");
  return { user, textarea };
}

describe("JobMatchPanel", () => {
  it("is disabled until a job description is entered", async () => {
    const { user, textarea } = await setup();
    const button = screen.getByRole("button", { name: "Check match" });
    expect(button).toHaveProperty("disabled", true);
    await user.type(textarea, "Python");
    expect(button).toHaveProperty("disabled", false);
  });

  it("shows score, keywords and suggestions", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(RESULT), { status: 200 })));
    const { user, textarea } = await setup();
    await user.type(textarea, "Python and Kubernetes");
    await user.click(screen.getByRole("button", { name: "Check match" }));

    const results = await screen.findByTestId("match-results");
    expect(within(results).getByRole("meter").getAttribute("aria-valuenow")).toBe("67");
    expect(within(results).getByText("Python")).toBeTruthy();
    expect(within(results).getByText("Summary, Skills")).toBeTruthy();
    expect(within(results).getByText("Kubernetes")).toBeTruthy();
    expect(within(results).getByText('Add "Kubernetes" if you have used it.')).toBeTruthy();

    await user.type(textarea, " Docker");
    expect(screen.getByText(/changed since this check/)).toBeTruthy();
  });

  it("explains errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const { user, textarea } = await setup();
    await user.type(textarea, "Python");
    await user.click(screen.getByRole("button", { name: "Check match" }));
    expect((await screen.findByRole("alert")).textContent).toContain("can't be reached");
  });
});
