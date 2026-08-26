import { expect, test } from "@playwright/test";

test("keyboard navigation and visible focus @desktop", async ({ page }) => {
  await page.goto("/");
  // Skip link is first in tab order.
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to main content")).toBeFocused();

  // The search input is reachable and labeled.
  const input = page.getByLabel("Ask a research question");
  await input.focus();
  await expect(input).toBeFocused();

  // The lens slider is a real slider with arrow-key control and a text value.
  const slider = page.getByRole("slider", { name: "Geographic perspective band" });
  await slider.focus();
  const before = await slider.getAttribute("aria-valuenow");
  await page.keyboard.press("ArrowRight");
  const after = await slider.getAttribute("aria-valuenow");
  expect(Number(after)).toBe(Number(before) + 1);
  await expect(slider).toHaveAttribute("aria-valuetext", /Border|North|South/);
});

test("desktop layout screenshot", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Ask a research question").fill("Kentucky loyalty and secession 1861");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByLabel("Search results").getByRole("article").first(),
  ).toBeVisible({ timeout: 20_000 });
  await page.screenshot({
    path: "e2e-screenshots/desktop-results.png",
    fullPage: true,
  });
});

test("mobile layout keeps the lens and citation controls @mobile", async ({
  page,
}) => {
  await page.goto("/");
  // Lens present and usable at mobile width.
  await expect(page.getByLabel("Perspective Lens")).toBeVisible();
  await expect(page.getByText("location is not loyalty")).toBeVisible();

  await page.getByLabel("Ask a research question").fill("Kentucky secession 1861");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByLabel("Search results").getByRole("article").first(),
  ).toBeVisible({ timeout: 20_000 });
  await page.screenshot({
    path: "e2e-screenshots/mobile-results.png",
    fullPage: true,
  });

  // Citation controls survive on mobile in the workspace.
  await page.goto(`/source/${encodeURIComponent("demo:magoffin-reply-1861")}`);
  await page.getByRole("tab", { name: "Citations" }).click();
  await expect(page.getByRole("button", { name: "Copy footnote" })).toBeVisible();
});

test("status indicators are not color-only @desktop", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Ask a research question").fill("Kentucky 1861");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const status = page.getByLabel("Archive status");
  await expect(status).toBeVisible({ timeout: 20_000 });
  // Every status chip carries text (count/state), not just a colored dot.
  const chips = status.locator("li");
  const n = await chips.count();
  for (let i = 0; i < n; i++) {
    const text = (await chips.nth(i).innerText()).trim();
    expect(text).toMatch(/:/);
  }
});
