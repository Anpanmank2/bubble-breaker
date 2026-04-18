import { test, expect } from "@playwright/test";

test("title screen loads and ENTRY starts stage 1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("btn-entry")).toBeVisible();
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("game-canvas")).toBeVisible();
});
