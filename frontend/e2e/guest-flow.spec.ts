import { expect, test } from "@playwright/test";
import { extractPdfText } from "./pdf";

test("guest fills the form, sees the preview, and downloads an ATS-friendly PDF", async ({ page }) => {
  await page.goto("/builder");
  const preview = page.getByTestId("resume-preview");

  await page.getByLabel("Full name").fill("Aysel Məmmədova");
  await page.getByLabel("Email").fill("aysel@example.com");
  await page.getByLabel("Location").fill("Bakı, Azərbaycan");
  await page.getByLabel("Professional summary").fill("Backend engineer. Şirkətdə ödəniş sistemləri quraşdırdım.");

  await page.getByRole("button", { name: "Add position" }).click();
  await page.getByLabel("Job title").fill("Backend Engineer");
  await page.getByLabel("Company").fill("Ağ Şəhər Solutions");
  await page.getByLabel("Start").fill("2022-05");
  await page.getByLabel("I currently work here").check();
  await page.getByLabel("Achievements 1", { exact: true }).fill("Built FastAPI services handling 3M requests per day");

  await page.getByRole("button", { name: "Add skill group" }).click();
  await page.getByLabel("Category").fill("Languages");
  await page.getByLabel("Skills", { exact: true }).fill("Python, TypeScript");

  await expect(preview.getByText("Aysel Məmmədova")).toBeVisible();
  await expect(preview.getByText("Backend Engineer — Ağ Şəhər Solutions")).toBeVisible();
  await expect(preview.getByText("May 2022 – Present")).toBeVisible();
  await expect(preview.getByText("Languages: Python, TypeScript")).toBeVisible();

  // Survives a reload (localStorage).
  await expect(page.getByRole("status")).toHaveText("Saved in this browser");
  await page.reload();
  await expect(preview.getByText("Backend Engineer — Ağ Şəhər Solutions")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Aysel_Mammadova_Resume.pdf");

  const { text, pages } = await extractPdfText(await download.path());
  expect(pages).toBe(1);
  for (const expected of [
    "Aysel Məmmədova",
    "Bakı, Azərbaycan | aysel@example.com",
    "SUMMARY",
    "Şirkətdə ödəniş sistemləri quraşdırdım.",
    "EXPERIENCE",
    "Backend Engineer — Ağ Şəhər Solutions",
    "May 2022 – Present",
    "• Built FastAPI services handling 3M requests per day",
    "SKILLS",
    "Languages: Python, TypeScript",
  ]) {
    expect(text).toContain(expected);
  }
  // Standard section order and no empty sections.
  expect(text.indexOf("SUMMARY")).toBeLessThan(text.indexOf("EXPERIENCE"));
  expect(text.indexOf("EXPERIENCE")).toBeLessThan(text.indexOf("SKILLS"));
  expect(text).not.toContain("EDUCATION");
  expect(text).not.toContain("PROJECTS");
});

test("loading the sample fills every standard section", async ({ page }) => {
  await page.goto("/builder");
  await page.getByRole("button", { name: "Load sample" }).click();
  const preview = page.getByTestId("resume-preview");
  for (const heading of ["Summary", "Experience", "Education", "Skills", "Projects"]) {
    await expect(preview.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
});
