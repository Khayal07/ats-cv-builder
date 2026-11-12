import { describe, expect, it } from "vitest";
import { contactLine, formatDateRange, formatYearMonth, isBlank } from "./format";

describe("formatYearMonth", () => {
  it("formats YYYY-MM as MMM YYYY", () => {
    expect(formatYearMonth("2024-01")).toBe("Jan 2024");
    expect(formatYearMonth("2019-12")).toBe("Dec 2019");
  });

  it("returns an empty string for empty or invalid input", () => {
    expect(formatYearMonth("")).toBe("");
    expect(formatYearMonth("2024")).toBe("");
    expect(formatYearMonth("2024-13")).toBe("");
    expect(formatYearMonth("abc")).toBe("");
  });
});

describe("formatDateRange", () => {
  it("formats a closed range with an en dash", () => {
    expect(formatDateRange("2021-03", "2023-07")).toBe("Mar 2021 – Jul 2023");
  });

  it("uses Present when the end date is null", () => {
    expect(formatDateRange("2022-05", null)).toBe("May 2022 – Present");
  });

  it("shows only the end date when start is missing", () => {
    expect(formatDateRange("", "2020-06")).toBe("Jun 2020");
    expect(formatDateRange(null, "2020-06")).toBe("Jun 2020");
  });

  it("shows only the start date when start and end are the same month", () => {
    expect(formatDateRange("2020-06", "2020-06")).toBe("Jun 2020");
  });

  it("returns empty when nothing is set", () => {
    expect(formatDateRange("", "")).toBe("");
    expect(formatDateRange(null, null)).toBe("");
  });

  it("does not print Present without a start date", () => {
    expect(formatDateRange("", null)).toBe("");
  });
});

describe("contactLine", () => {
  it("joins non-empty parts with a pipe separator", () => {
    expect(
      contactLine({
        fullName: "Aysel",
        headline: "",
        email: "a@example.com",
        phone: "",
        location: "Bakı, Azərbaycan",
        links: [{ id: "1", label: "GitHub", url: "github.com/aysel" }],
      }),
    ).toBe("Bakı, Azərbaycan | a@example.com | github.com/aysel");
  });

  it("skips links without a url", () => {
    expect(
      contactLine({
        fullName: "",
        headline: "",
        email: "",
        phone: "+994 50 000 00 00",
        location: "",
        links: [{ id: "1", label: "Site", url: "  " }],
      }),
    ).toBe("+994 50 000 00 00");
  });
});

describe("isBlank", () => {
  it("detects whitespace-only strings", () => {
    expect(isBlank("  \n")).toBe(true);
    expect(isBlank("x")).toBe(false);
  });
});
