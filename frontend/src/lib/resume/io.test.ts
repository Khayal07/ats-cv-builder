import { describe, expect, it } from "vitest";
import { parseImportedJson, resumeFileBase, serializeDocument } from "./io";
import { defaultDocument } from "./migrate";
import { sampleResume } from "./sample";

describe("JSON import/export", () => {
  it("round-trips an exported document", () => {
    const doc = {
      ...defaultDocument(),
      resume: sampleResume(),
      settings: { template: "modern" as const, pageSize: "LETTER" as const },
      jobDescription: "Python developer",
    };
    expect(parseImportedJson(serializeDocument(doc))).toEqual(doc);
  });

  it("accepts a bare resume object", () => {
    const resume = sampleResume();
    const doc = parseImportedJson(JSON.stringify(resume));
    expect(doc?.resume).toEqual(resume);
    expect(doc?.settings.template).toBe("classic");
  });

  it("rejects invalid JSON and unrelated objects", () => {
    expect(parseImportedJson("not json")).toBeNull();
    expect(parseImportedJson("[1,2,3]")).toBeNull();
    expect(parseImportedJson('{"hello":"world"}')).toBeNull();
  });
});

describe("resumeFileBase", () => {
  it("transliterates Azerbaijani letters", () => {
    expect(resumeFileBase("Aysel Məmmədova")).toBe("Aysel_Mammadova_Resume");
    expect(resumeFileBase("İlqar Şükürov-Çələbi")).toBe("Ilqar_Sukurov_Calabi_Resume");
  });

  it("falls back to Resume for empty names", () => {
    expect(resumeFileBase("   ")).toBe("Resume");
    expect(resumeFileBase("")).toBe("Resume");
  });
});
