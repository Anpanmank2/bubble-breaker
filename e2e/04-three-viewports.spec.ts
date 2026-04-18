import { test, expect } from "@playwright/test";
import path from "node:path";

test("title screen renders across viewport (screenshot artifact)", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByTestId("btn-entry")).toBeVisible();
  const outDir = path.resolve(__dirname, "..", "smoke-screenshots");
  await page.screenshot({
    path: path.join(outDir, `title-${testInfo.project.name}.png`),
    fullPage: true,
  });
});
