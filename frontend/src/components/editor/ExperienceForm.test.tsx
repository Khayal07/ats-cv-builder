// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { ResumeProvider, useEditor } from "@/state/ResumeProvider";
import { memoryAdapter } from "@/test/memoryAdapter";
import { ExperienceForm } from "./ExperienceForm";

function ContextPreview() {
  const { doc, status } = useEditor();
  return status === "ready" ? <ResumePreview resume={doc.resume} /> : null;
}

function setup() {
  const user = userEvent.setup();
  render(
    <ResumeProvider adapter={memoryAdapter()} saveDelayMs={0}>
      <ExperienceForm />
      <ContextPreview />
    </ResumeProvider>,
  );
  return user;
}

describe("ExperienceForm", () => {
  it("adds a position and shows it in the preview", async () => {
    const user = setup();
    await screen.findByTestId("resume-preview");

    await user.click(screen.getByRole("button", { name: "Add position" }));
    await user.type(screen.getByLabelText("Job title"), "Backend Engineer");
    await user.type(screen.getByLabelText("Company"), "Kapital Tech");
    await user.type(screen.getByLabelText("Achievements 1"), "Built APIs in FastAPI");

    const preview = screen.getByTestId("resume-preview");
    expect(within(preview).getByText("Experience")).toBeTruthy();
    expect(within(preview).getByText("Backend Engineer — Kapital Tech")).toBeTruthy();
    expect(within(preview).getByText("Built APIs in FastAPI")).toBeTruthy();
  });

  it("adds a new bullet on Enter and removes an empty one on Backspace", async () => {
    const user = setup();
    await screen.findByTestId("resume-preview");
    await user.click(screen.getByRole("button", { name: "Add position" }));

    await user.type(screen.getByLabelText("Achievements 1"), "First{Enter}");
    const second = screen.getByLabelText("Achievements 2");
    expect(document.activeElement).toBe(second);

    await user.type(second, "{Backspace}");
    expect(screen.queryByLabelText("Achievements 2")).toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText("Achievements 1"));
  });

  it("marks a position as current and shows Present", async () => {
    const user = setup();
    await screen.findByTestId("resume-preview");
    await user.click(screen.getByRole("button", { name: "Add position" }));
    await user.type(screen.getByLabelText("Job title"), "Engineer");
    await user.type(screen.getByLabelText("Start"), "2022-05");
    await user.click(screen.getByLabelText("I currently work here"));

    expect((screen.getByLabelText("End") as HTMLInputElement).disabled).toBe(true);
    expect(within(screen.getByTestId("resume-preview")).getByText("May 2022 – Present")).toBeTruthy();
  });

  it("reorders and removes positions", async () => {
    const user = setup();
    await screen.findByTestId("resume-preview");
    await user.click(screen.getByRole("button", { name: "Add position" }));
    await user.click(screen.getByRole("button", { name: "Add position" }));
    const [first, second] = screen.getAllByLabelText("Job title");
    await user.type(first, "Alpha");
    await user.type(second, "Beta");

    await user.click(screen.getByRole("button", { name: "Move Alpha down" }));
    expect(screen.getAllByLabelText("Job title").map((el) => (el as HTMLInputElement).value)).toEqual([
      "Beta",
      "Alpha",
    ]);

    await user.click(screen.getByRole("button", { name: "Remove Beta" }));
    expect(screen.getAllByLabelText("Job title")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Move Alpha up" })).toHaveProperty("disabled", true);
  });
});
