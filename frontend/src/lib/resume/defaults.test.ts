import { describe, expect, it } from "vitest";
import {
  createId,
  emptyResume,
  newEducation,
  newExperience,
  newProject,
  newSkillGroup,
} from "./defaults";
import { sampleResume } from "./sample";
import { RESUME_SCHEMA_VERSION } from "./types";

describe("defaults", () => {
  it("creates an empty resume with the current schema version", () => {
    const resume = emptyResume();
    expect(resume.schemaVersion).toBe(RESUME_SCHEMA_VERSION);
    expect(resume.experience).toEqual([]);
    expect(resume.basics.links).toEqual([]);
  });

  it("creates unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()));
    expect(ids.size).toBe(100);
  });

  it("creates new entries with distinct ids and one empty bullet where relevant", () => {
    const a = newExperience();
    const b = newExperience();
    expect(a.id).not.toBe(b.id);
    expect(a.bullets).toEqual([""]);
    expect(newProject().bullets).toEqual([""]);
    expect(newEducation().details).toEqual([]);
    expect(newSkillGroup().items).toEqual([]);
  });
});

describe("sampleResume", () => {
  it("fills every section", () => {
    const resume = sampleResume();
    expect(resume.basics.fullName).not.toBe("");
    expect(resume.summary).not.toBe("");
    expect(resume.experience.length).toBeGreaterThan(0);
    expect(resume.education.length).toBeGreaterThan(0);
    expect(resume.skills.length).toBeGreaterThan(0);
    expect(resume.projects.length).toBeGreaterThan(0);
  });

  it("contains Azerbaijani characters for font coverage checks", () => {
    const text = JSON.stringify(sampleResume());
    for (const char of ["ə", "ı", "ğ", "ş", "ç", "ö", "ü", "İ", "Ə", "Ş"]) {
      expect(text).toContain(char);
    }
  });
});
