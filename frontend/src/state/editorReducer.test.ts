import { describe, expect, it } from "vitest";
import { defaultDocument } from "@/lib/resume/migrate";
import { sampleResume } from "@/lib/resume/sample";
import { editorReducer, moveItem } from "./editorReducer";

const withSample = () => ({ ...defaultDocument(), resume: sampleResume() });

describe("editorReducer", () => {
  it("sets a basics field without touching others", () => {
    const doc = editorReducer(withSample(), {
      type: "setBasicsField",
      field: "email",
      value: "new@example.com",
    });
    expect(doc.resume.basics.email).toBe("new@example.com");
    expect(doc.resume.basics.fullName).toBe("Aysel Məmmədova");
  });

  it("adds, updates and removes links", () => {
    let doc = editorReducer(defaultDocument(), { type: "addLink" });
    const id = doc.resume.basics.links[0].id;
    doc = editorReducer(doc, { type: "updateLink", id, patch: { url: "github.com/x" } });
    expect(doc.resume.basics.links[0]).toMatchObject({ id, url: "github.com/x" });
    doc = editorReducer(doc, { type: "removeLink", id });
    expect(doc.resume.basics.links).toEqual([]);
  });

  it("adds an entry to the requested section", () => {
    const doc = editorReducer(defaultDocument(), { type: "addEntry", section: "experience" });
    expect(doc.resume.experience).toHaveLength(1);
    expect(doc.resume.education).toHaveLength(0);
  });

  it("updates only the targeted entry", () => {
    const start = withSample();
    const [first, second] = start.resume.experience;
    const doc = editorReducer(start, {
      type: "updateEntry",
      section: "experience",
      id: second.id,
      patch: { role: "Lead Engineer", bullets: ["One"] },
    });
    expect(doc.resume.experience[1]).toMatchObject({ role: "Lead Engineer", bullets: ["One"] });
    expect(doc.resume.experience[0]).toBe(first);
  });

  it("removes an entry", () => {
    const start = withSample();
    const id = start.resume.skills[0].id;
    const doc = editorReducer(start, { type: "removeEntry", section: "skills", id });
    expect(doc.resume.skills.map((group) => group.id)).not.toContain(id);
  });

  it("moves entries up and down, ignoring moves past the edges", () => {
    const start = withSample();
    const [a, b] = start.resume.experience;
    const down = editorReducer(start, {
      type: "moveEntry",
      section: "experience",
      id: a.id,
      direction: 1,
    });
    expect(down.resume.experience.map((entry) => entry.id)).toEqual([b.id, a.id]);
    const edge = editorReducer(start, {
      type: "moveEntry",
      section: "experience",
      id: a.id,
      direction: -1,
    });
    expect(edge.resume.experience).toBe(start.resume.experience);
  });

  it("updates settings and the job description", () => {
    let doc = editorReducer(defaultDocument(), { type: "setSettings", patch: { pageSize: "LETTER" } });
    doc = editorReducer(doc, { type: "setJobDescription", value: "We need React" });
    expect(doc.settings).toEqual({ template: "classic", pageSize: "LETTER" });
    expect(doc.jobDescription).toBe("We need React");
  });

  it("does not mutate the previous state", () => {
    const start = withSample();
    const snapshot = JSON.stringify(start);
    editorReducer(start, { type: "setSummary", value: "changed" });
    editorReducer(start, { type: "addEntry", section: "projects" });
    expect(JSON.stringify(start)).toBe(snapshot);
  });
});

describe("moveItem", () => {
  it("returns the same array for invalid indexes", () => {
    const items = [1, 2, 3];
    expect(moveItem(items, -1, 1)).toBe(items);
    expect(moveItem(items, 2, 1)).toBe(items);
  });
});
