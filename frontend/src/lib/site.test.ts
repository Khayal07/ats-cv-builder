import { describe, expect, it } from "vitest";
import { siteConfig } from "@/lib/site";

describe("siteConfig", () => {
  it("has a name and description", () => {
    expect(siteConfig.name).toBe("ATS CV Builder");
    expect(siteConfig.description.length).toBeGreaterThan(0);
  });
});
