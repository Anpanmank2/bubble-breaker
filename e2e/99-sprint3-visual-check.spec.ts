import { test, expect } from "@playwright/test";
import * as path from "node:path";

// Sprint 3 Track A Phase 1 visual check: ボスサイズ 120×140 + skin #f4c28a 反映確認
// スクリーンショットを /tmp に保存して目視

const SCREENSHOT_DIR = "/tmp/bb-sprint3-visuals";

test.beforeAll(async () => {
  const fs = await import("node:fs");
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

async function reachBoss(page: import("@playwright/test").Page) {
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("btn-fight-boss").click();
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: { boss: unknown } }).__gs;
      return gs?.boss !== null && gs?.boss !== undefined;
    },
    { timeout: 10_000 }
  );
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: { player: { invincible: number } } }).__gs;
    if (gs?.player) gs.player.invincible = 999_999;
  });
  await page.waitForTimeout(500); // 描画安定待ち
}

for (const stage of [1, 2, 3, 4]) {
  test(`Sprint 3 visual: Stage ${stage} boss`, async ({ page }) => {
    await page.goto(`http://localhost:3000/?debug=1&stage=${stage}&quick=1&fxDuration=0`);
    await reachBoss(page);
    const bossInfo = await page.evaluate(() => {
      const gs = (window as unknown as { __gs?: { boss: { x: number; y: number; w: number; h: number; hp: number; maxHp: number } | null } }).__gs;
      return gs?.boss ?? null;
    });
    console.log(`Stage ${stage} boss:`, JSON.stringify(bossInfo));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `stage${stage}-boss.png`), fullPage: false });
  });
}
