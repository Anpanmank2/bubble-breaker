import { test, expect } from "@playwright/test";
import path from "node:path";

// C-6: 3-viewport visual artifacts for each key screen.
// Title + HandReveal are captured here. CHAMPION + GameOver are already captured
// by specs 06 and 07 respectively (one file each), so they also end up
// screenshotted on all 3 viewports via the project matrix.
const outDir = path.resolve(__dirname, "..", "smoke-screenshots");

test("C-6a title screen captured per viewport", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByTestId("btn-entry")).toBeVisible();
  await page.screenshot({
    path: path.join(outDir, `title-matrix-${testInfo.project.name}.png`),
    fullPage: true,
  });
});

test("C-6b hand-reveal (FOUR OF A KIND) captured per viewport", async ({ page }, testInfo) => {
  await page.goto("/?test=four&quick=1");
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.screenshot({
    path: path.join(outDir, `handreveal-${testInfo.project.name}.png`),
    fullPage: true,
  });
});
