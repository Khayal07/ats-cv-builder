import { expect, test } from "@playwright/test";

const RESULT = {
  score: 67,
  matched: [{ term: "Python", weight: 4, category: "skill", sections: ["summary", "skills"] }],
  missing: [{ term: "Kubernetes", weight: 2, category: "skill" }],
  suggestions: [
    {
      type: "missing_keyword",
      severity: "medium",
      message: 'Add "Kubernetes" if you have used it: the job description asks for it.',
      term: "Kubernetes",
    },
  ],
};

test("checks the resume against a job description", async ({ page }) => {
  let requestBody: { resume: { basics: { fullName: string } }; job_description: string } | null = null;
  await page.route("**/api/score", async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ json: RESULT });
  });

  await page.goto("/builder");
  await page.getByRole("button", { name: "Load sample" }).click();
  await page.getByRole("tab", { name: "Match a job" }).click();
  await page.getByLabel("Job description").fill("Python and Kubernetes engineer");
  await page.getByRole("button", { name: "Check match" }).click();

  const results = page.getByTestId("match-results");
  await expect(results.getByRole("meter", { name: "Keyword match" })).toHaveAttribute("aria-valuenow", "67");
  await expect(results.getByText("Python")).toBeVisible();
  await expect(results.getByText("Kubernetes", { exact: true })).toBeVisible();
  await expect(results.getByText(/Add "Kubernetes"/)).toBeVisible();

  expect(requestBody!.job_description).toBe("Python and Kubernetes engineer");
  expect(requestBody!.resume.basics.fullName).toBe("Aysel Məmmədova");

  // The job description is saved with the resume.
  await page.reload();
  await page.getByRole("tab", { name: "Match a job" }).click();
  await expect(page.getByLabel("Job description")).toHaveValue("Python and Kubernetes engineer");
});

test("shows a clear error when the scoring server fails", async ({ page }) => {
  await page.route("**/api/score", (route) => route.fulfill({ status: 500, body: "boom" }));
  await page.goto("/builder");
  await page.getByRole("tab", { name: "Match a job" }).click();
  await page.getByLabel("Job description").fill("Python");
  await page.getByRole("button", { name: "Check match" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "scoring server" })).toContainText(
    "returned an error (500)",
  );
});
