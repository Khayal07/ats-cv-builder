import { describe, expect, it } from "vitest";
import { parseEditorDocument, parseResume } from "./migrate";
import { sampleResume } from "./sample";

describe("parseResume", () => {
  it("round-trips a valid resume", () => {
    const resume = sampleResume();
    expect(parseResume(JSON.parse(JSON.stringify(resume)))).toEqual(resume);
  });

  it("rejects non-objects and unknown schema versions", () => {
    expect(parseResume(null)).toBeNull();
    expect(parseResume("resume")).toBeNull();
    expect(parseResume([])).toBeNull();
    expect(parseResume({ schemaVersion: 99 })).toBeNull();
  });

  it("fills missing fields with defaults", () => {
    const resume = parseResume({ basics: { fullName: "Aysel" } });
    expect(resume?.basics.fullName).toBe("Aysel");
    expect(resume?.basics.email).toBe("");
    expect(resume?.experience).toEqual([]);
    expect(resume?.schemaVersion).toBe(1);
  });

  it("drops wrongly typed values", () => {
    const resume = parseResume({
      summary: 42,
      experience: [{ company: "X", bullets: ["ok", 5, null] }, "junk"],
    });
    expect(resume?.summary).toBe("");
    expect(resume?.experience).toHaveLength(1);
    expect(resume?.experience[0].bullets).toEqual(["ok"]);
  });

  it("keeps null end dates (Present) and assigns missing or duplicate ids", () => {
    const resume = parseResume({
      experience: [
        { id: "a", endDate: null },
        { id: "a", endDate: "2020-01" },
        { endDate: "2021-01" },
      ],
    });
    const ids = resume!.experience.map((entry) => entry.id);
    expect(resume!.experience[0].endDate).toBeNull();
    expect(ids[0]).toBe("a");
    expect(new Set(ids).size).toBe(3);
  });
});

describe("parseEditorDocument", () => {
  it("defaults invalid settings", () => {
    const doc = parseEditorDocument({
      resume: {},
      settings: { template: "fancy", pageSize: "A3" },
    });
    expect(doc?.settings).toEqual({ template: "classic", pageSize: "A4" });
    expect(doc?.jobDescription).toBe("");
  });

  it("returns null without a resume", () => {
    expect(parseEditorDocument({ settings: {} })).toBeNull();
  });
});
