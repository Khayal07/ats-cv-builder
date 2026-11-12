import { describe, expect, it } from "vitest";
import { emptyResume, newExperience, newSkillGroup } from "./defaults";
import { sampleResume } from "./sample";
import {
  cleanList,
  educationDegree,
  experienceTitle,
  projectTitle,
  skillLine,
  visibleSections,
} from "./view";

describe("visibleSections", () => {
  it("returns nothing for an empty resume", () => {
    expect(visibleSections(emptyResume())).toEqual([]);
  });

  it("returns all sections in the standard order for the sample", () => {
    expect(visibleSections(sampleResume())).toEqual([
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
    ]);
  });

  it("ignores entries that are only blank", () => {
    const resume = emptyResume();
    resume.experience = [newExperience()];
    resume.skills = [{ ...newSkillGroup(), category: "Languages", items: [" "] }];
    resume.summary = "   ";
    expect(visibleSections(resume)).toEqual([]);
  });
});

describe("text helpers", () => {
  it("cleans lists", () => {
    expect(cleanList([" a ", "", "  ", "b"])).toEqual(["a", "b"]);
  });

  it("builds titles without dangling separators", () => {
    const entry = { ...newExperience(), role: "Engineer", company: "" };
    expect(experienceTitle(entry)).toBe("Engineer");
    expect(experienceTitle({ ...entry, company: "Acme" })).toBe("Engineer — Acme");
    expect(projectTitle({ ...sampleResume().projects[0], url: "" })).toBe("Open Budget Tracker");
    expect(educationDegree({ ...sampleResume().education[0], field: "" })).toBe("BSc");
  });

  it("formats skill lines with and without a category", () => {
    expect(skillLine({ id: "1", category: "Languages", items: ["Python", " ", "SQL"] })).toBe(
      "Languages: Python, SQL",
    );
    expect(skillLine({ id: "1", category: "", items: ["Python"] })).toBe("Python");
  });
});
