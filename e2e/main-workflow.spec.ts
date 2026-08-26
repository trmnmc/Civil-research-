import { expect, test } from "@playwright/test";

/**
 * The acceptance workflow: search Kentucky loyalty & secession 1861,
 * get real primary-source results, move the Perspective Lens from North
 * through Border to South, watch ranking change while facts don't, and open
 * a cited worldview synthesis.
 */

test("Kentucky 1861 search → lens sweep → cited worldview", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Archive Lens/);

  // The lens sits directly below the search field with its safeguards visible.
  await expect(page.getByText("location is not loyalty")).toBeVisible();

  const searchBox = page.getByRole("searchbox").or(page.getByLabel("Ask a research question"));
  await searchBox.fill("Kentucky loyalty and secession 1861");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  // Results arrive from the verified reference set.
  const results = page.getByLabel("Search results").getByRole("article");
  await expect(results.first()).toBeVisible({ timeout: 20_000 });
  const initialCount = await results.count();
  expect(initialCount).toBeGreaterThanOrEqual(3);

  // The interpretation preserves the exact query and shows expansions.
  await expect(
    page.getByText("“Kentucky loyalty and secession 1861”"),
  ).toBeVisible();
  await page.getByText(/historical expansion/).click();
  await expect(page.getByText(/disunion/).first()).toBeVisible();

  // Provider statuses are reported per archive.
  await expect(page.getByLabel("Archive status")).toBeVisible();

  // Capture the initial ordering (Border-centered lens).
  const titlesBefore = await results
    .locator("h3")
    .allInnerTexts();
  expect(titlesBefore.join(" ")).toMatch(/Magoffin/);

  // Sweep the lens to the South band with the keyboard.
  const slider = page.getByRole("slider", {
    name: "Geographic perspective band",
  });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(page.getByText(/Emphasizing sources from communities in the/)).toContainText(
    "South",
  );

  // Ranking re-runs (debounced) — ordering changes, results are not hidden.
  await expect(async () => {
    const titlesAfter = await results.locator("h3").allInnerTexts();
    expect(titlesAfter.length).toBeGreaterThanOrEqual(3);
    expect(titlesAfter.join("|")).not.toBe(titlesBefore.join("|"));
  }).toPass({ timeout: 15_000 });
  // The same evidence is still present — the lens re-weights, never erases.
  const titlesAfter = await results.locator("h3").allInnerTexts();
  expect(titlesAfter.join(" ")).toMatch(/Magoffin/);

  // Open the Worldview panel: a cited synthesis, with limitations.
  await page.getByRole("tab", { name: "Worldview" }).click();
  const worldview = page.getByLabel("Worldview at the time");
  await expect(worldview).toBeVisible({ timeout: 20_000 });
  await expect(worldview.getByText(/Limitations of this evidence/)).toBeVisible();
  await expect(
    worldview.getByText(/not role-play/),
  ).toBeVisible();

  // Claims carry citation chips that open the underlying record.
  const chip = worldview.getByRole("button").filter({ hasText: /Magoffin|Bulletin|Declaration|Kentucky/ }).first();
  await chip.click();
  await expect(page.getByRole("tab", { name: "Source preview" })).toHaveAttribute(
    "data-state",
    "active",
  );
  await expect(
    page.getByText("Open at", { exact: false }).first(),
  ).toBeVisible();
});

test("zero-result searches get a useful empty state", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Ask a research question")
    .fill("zeppelin bitcoin telegraphy 1861");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No sources matched.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(/disunion/)).toBeVisible();
});

test("provider setup guidance is reported for the National Archives", async ({
  request,
}) => {
  const res = await request.get("/api/providers");
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  const nara = data.providers.find((p: { id: string }) => p.id === "nara");
  expect(nara.configured).toBe(false);
  expect(nara.setupGuidance).toContain("Catalog_API@nara.gov");
});
