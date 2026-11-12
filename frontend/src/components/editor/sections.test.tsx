// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { ResumeProvider, useEditor } from "@/state/ResumeProvider";
import { memoryAdapter } from "@/test/memoryAdapter";
import { EducationForm } from "./EducationForm";
import { ProjectsForm } from "./ProjectsForm";
import { SkillsForm } from "./SkillsForm";

function ContextPreview() {
  const { doc, status } = useEditor();
  return status === "ready" ? <ResumePreview resume={doc.resume} /> : null;
}

async function setup() {
  const user = userEvent.setup();
  render(
    <ResumeProvider adapter={memoryAdapter()} saveDelayMs={0}>
      <EducationForm />
      <SkillsForm />
      <ProjectsForm />
      <ContextPreview />
    </ResumeProvider>,
  );
  await screen.findByTestId("resume-preview");
  return { user, preview: () => within(screen.getByTestId("resume-preview")) };
}

describe("Education, Skills and Projects forms", () => {
  it("renders education with degree and field", async () => {
    const { user, preview } = await setup();
    await user.click(screen.getByRole("button", { name: "Add education" }));
    await user.type(screen.getByLabelText("School or university"), "ADA University");
    await user.type(screen.getByLabelText("Degree"), "BSc");
    await user.type(screen.getByLabelText("Field of study"), "Computer Science");

    expect(preview().getByText("Education")).toBeTruthy();
    expect(preview().getByText("ADA University")).toBeTruthy();
    expect(preview().getByText(/BSc, Computer Science/)).toBeTruthy();
  });

  it("keeps commas while typing skills and renders a clean line", async () => {
    const { user, preview } = await setup();
    await user.click(screen.getByRole("button", { name: "Add skill group" }));
    await user.type(screen.getByLabelText("Category"), "Languages");
    const skills = screen.getByLabelText("Skills") as HTMLInputElement;
    await user.type(skills, "Python, TypeScript, ");

    expect(skills.value).toBe("Python, TypeScript, ");
    expect(preview().getByText("Languages: Python, TypeScript")).toBeTruthy();
  });

  it("renders a project with its link", async () => {
    const { user, preview } = await setup();
    await user.click(screen.getByRole("button", { name: "Add project" }));
    await user.type(screen.getByLabelText("Project name"), "Budget Tracker");
    await user.type(screen.getByLabelText("Link"), "github.com/me/budget");

    expect(preview().getByText("Projects")).toBeTruthy();
    expect(preview().getByText("Budget Tracker | github.com/me/budget")).toBeTruthy();
  });
});
