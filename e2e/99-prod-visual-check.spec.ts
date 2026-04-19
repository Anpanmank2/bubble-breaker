import { test, expect } from "@playwright/test";
import * as path from "node:path";

// Sprint 3 Track A Phase 2 本番 URL 検証
const PROD = "https://bubble-breaker-gules.vercel.app";
const SCREENSHOT_DIR = "/tmp/bb-sprint3-prod";

test.beforeAll(async () => {
  const fs = await import("node:fs");
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test(`Sprint 3 prod entry screen`, async ({ page }) => {
  const cb = Date.now();
  await page.goto(`${PROD}/?_cb=${cb}`);
  await page.waitForSelector('[data-testid="btn-entry"]', { timeout: 20_000 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `prod-entry.png`) });
});

for (const stage of [1, 2, 3, 4]) {
  test(`Sprint 3 prod Stage ${stage} boss`, async ({ page }) => {
    const cb = Date.now();
    await page.goto(`${PROD}/?_cb=${cb}&debug=1&stage=${stage}&quick=1`);
    await page.waitForSelector('[data-testid="btn-entry"]', { timeout: 20_000 });
    await page.getByTestId("btn-entry").click();
    await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("btn-fight-boss").click();
    // production では window.__gs が消失するため boss 描画開始を時間待ちで代替
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `prod-stage${stage}-boss.png`) });
  });
}
