import { expect, test } from "@playwright/test";

/**
 * Emancipation acceptance flow: search reactions Sept 1862 – Jan 1863,
 * compare geographically/politically different sources, distinguish
 * contemporary documents from later accounts, save to a project, add a
 * note, and export citations.
 */

test("emancipation search → compare A/B → cited comparison", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Ask a research question")
    .fill("reactions to emancipation between September 1862 and January 1863");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  const results = page.getByLabel("Search results").getByRole("article");
  await expect(results.first()).toBeVisible({ timeout: 20_000 });

  // The month window was understood.
  await expect(page.getByText("1862-09 – 1863-01")).toBeVisible();

  // Evidence-class badges distinguish contemporaneous documents from
  // retrospective accounts on the cards themselves.
  await expect(
    page.getByText("Contemporaneous", { exact: false }).first(),
  ).toBeVisible();

  // Add one Northern/national and one Southern source to the comparison.
  const national = results.filter({ hasText: "Preliminary Emancipation" }).first();
  await national
    .getByRole("button", { name: /comparison, left side/ })
    .click();
  const southern = results.filter({ hasText: /Declaration.*Mississippi|Declaration.*South Carolina|Richmond/ }).first();
  await southern
    .getByRole("button", { name: /comparison, right side/ })
    .click();

  await page.goto("/compare");
  await expect(
    page.getByRole("heading", { name: "Compare Perspectives" }),
  ).toBeVisible();

  // Documents render first, in two columns.
  const left = page.getByLabel("Left comparison column");
  const right = page.getByLabel("Right comparison column");
  await expect(left.getByRole("article").first()).toBeVisible({ timeout: 15_000 });
  await expect(right.getByRole("article").first()).toBeVisible();

  // Beneath them, cited statements.
  const analysis = page.getByLabel("Comparison analysis");
  await expect(analysis.getByText(/Shared factual ground|Different|Conflicts/).first())
    .toBeVisible({ timeout: 15_000 });
  await expect(analysis.getByRole("link").first()).toBeVisible();

  // Lock one side.
  const lockButton = page.getByRole("button", { name: /Lock side A/ });
  await lockButton.click();
  await expect(page.getByRole("button", { name: /Unlock side A/ })).toBeVisible();
});

test("save to project → note → tag → export citations", async ({ page }) => {
  const projectName = `Emancipation study ${Date.now()}`;

  await page.goto("/");
  await page
    .getByLabel("Ask a research question")
    .fill("emancipation proclamation 1863");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const results = page.getByLabel("Search results").getByRole("article");
  await expect(results.first()).toBeVisible({ timeout: 20_000 });

  // Save the Emancipation Proclamation record into a new project.
  const target = results.filter({ hasText: "The Emancipation Proclamation" }).first();
  await target.getByRole("button", { name: /^Save/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Save to project")).toBeVisible();
  await dialog.getByLabel("New project name").fill(projectName);
  await dialog.getByRole("button", { name: "Create & save" }).click();
  await expect(dialog.getByText(/Saved\./)).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");

  // The notebook lists the project; open it.
  await page.goto("/notebook");
  await page.getByRole("link", { name: projectName }).click();
  await expect(
    page.getByRole("heading", { name: projectName }),
  ).toBeVisible();
  await expect(page.getByText("The Emancipation Proclamation").first()).toBeVisible();

  // Add a note attached to the project.
  await page.getByLabel("Note text").fill("Key war measure; compare border-state reactions.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(
    page.getByText("Key war measure; compare border-state reactions."),
  ).toBeVisible();

  // Tag the saved source.
  await page.getByPlaceholder("add tag…").first().fill("emancipation");
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await expect(page.getByText("emancipation", { exact: true })).toBeVisible();

  // Exports produce citations built from verified metadata.
  const projectUrl = page.url();
  const projectId = projectUrl.split("/").pop();
  const bib = await page.request.get(
    `/api/projects/${projectId}/export?format=bibliography`,
  );
  expect(bib.ok()).toBeTruthy();
  const bibText = await bib.text();
  expect(bibText).toContain("Emancipation Proclamation");
  expect(bibText).toContain("National Archives");
  expect(bibText).not.toMatch(/undefined/);

  const bibtex = await page.request.get(
    `/api/projects/${projectId}/export?format=bibtex`,
  );
  expect((await bibtex.text())).toContain("@misc{");

  const packet = await page.request.get(
    `/api/projects/${projectId}/export?format=packet`,
  );
  const packetText = await packet.text();
  expect(packetText).toContain("Research packet");
  expect(packetText).toContain("Scans are not redistributed");
});

test("source workspace: transcript beside scan info, analysis, citations", async ({
  page,
}) => {
  await page.goto(`/source/${encodeURIComponent("demo:magoffin-reply-1861")}`);
  await expect(
    page.getByRole("heading", {
      name: /Governor Beriah Magoffin's reply/,
    }),
  ).toBeVisible();

  // The three date distinctions and classification explanation are visible.
  await expect(page.getByText("Document created: 1861-04-15")).toBeVisible();
  await expect(page.getByText(/Classification:/)).toBeVisible();

  // Transcript renders the verbatim excerpt with its source note.
  await expect(
    page.getByText("Kentucky will furnish no troops"),
  ).toBeVisible();
  await expect(page.getByText(/Text source:/)).toBeVisible();

  // Transcript search highlights without altering text.
  await page.getByLabel("Search within transcript").fill("wicked");
  await expect(page.locator("mark").first()).toHaveText("wicked");

  // Analysis separates metadata from inference.
  await page.getByRole("tab", { name: "Source analysis" }).click();
  await expect(page.getByText("Who created it?")).toBeVisible();
  await expect(page.getByText("metadata", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("inference", { exact: true }).first()).toBeVisible();

  // Citations tab: Chicago/Turabian, copyable.
  await page.getByRole("tab", { name: "Citations" }).click();
  await expect(page.getByText(/Chicago \/ Turabian footnote/)).toBeVisible();
  await expect(page.getByText(/Beriah Magoffin, “Reply to Secretary/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy BibTeX" }),
  ).toBeVisible();

  // Raw provider metadata is preserved and viewable.
  await page.getByRole("tab", { name: "Raw metadata" }).click();
  await expect(page.getByText("Provenance")).toBeVisible();
});
