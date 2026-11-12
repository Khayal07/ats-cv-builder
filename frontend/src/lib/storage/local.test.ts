import { describe, expect, it } from "vitest";
import { defaultDocument } from "@/lib/resume/migrate";
import { sampleResume } from "@/lib/resume/sample";
import { createLocalAdapter } from "./local";

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

describe("createLocalAdapter", () => {
  it("saves and loads a document", async () => {
    const store = memoryStore();
    const adapter = createLocalAdapter("k", () => store);
    const doc = { ...defaultDocument(), resume: sampleResume(), jobDescription: "React" };
    await adapter.save(doc);
    expect(await adapter.load()).toEqual(doc);
  });

  it("returns null when nothing is stored", async () => {
    expect(await createLocalAdapter("k", () => memoryStore()).load()).toBeNull();
  });

  it("returns null for corrupted JSON", async () => {
    const store = memoryStore();
    store.setItem("k", "{not json");
    expect(await createLocalAdapter("k", () => store).load()).toBeNull();
  });

  it("returns null when storage is unavailable", async () => {
    const adapter = createLocalAdapter("k", () => null);
    expect(await adapter.load()).toBeNull();
    await expect(adapter.save(defaultDocument())).rejects.toThrow();
  });

  it("clears the stored document", async () => {
    const store = memoryStore();
    const adapter = createLocalAdapter("k", () => store);
    await adapter.save(defaultDocument());
    adapter.clear();
    expect(store.data.size).toBe(0);
  });
});
