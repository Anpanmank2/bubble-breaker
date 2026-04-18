import { test, expect } from "@playwright/test";

test("?test=royal&quick=1 forces royal flush showdown at the end of Stage 1", async ({ page }) => {
  await page.goto("/?test=royal&quick=1");
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("game-canvas")).toBeVisible();
  await expect(page.getByTestId("royal-clear")).toBeVisible({ timeout: 30_000 });
});
