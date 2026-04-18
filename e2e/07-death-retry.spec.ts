import { test, expect } from "@playwright/test";
import path from "node:path";

// C-3: Normal death -> gameover -> retry -> title
// Using Stage 4 (spawnRate=35, fastest enemies) with NO player input — player sits at x=80, y=360
// and gets hit repeatedly. Life 3 -> 2 -> 1 -> 0 -> gameover screen (with 300ms transition).
// NOTE: we don't use ?quick=1 here because quick mode shortens the collect phase to ~2s,
// which exits to handReveal before enemies have time to shoot the player. With the normal
// 25s collect duration, Stage 4's spawnRate=35 produces plenty of incoming fire.
// If the player survives collect, handReveal appears. We then click FIGHT BOSS to enter
// boss phase, where the boss rapidly kills the (idle, low-power) player.
test("C-3 sitting idle on stage 4 triggers busted -> retry returns to title", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.goto("/?stage=4&debug=1");
  await page.getByTestId("btn-entry").click();

  // Don't touch the canvas. Let enemies shoot / collide with the player repeatedly during
  // the 25s collect phase. If the player survives collect, click FIGHT BOSS when it appears
  // so that boss-phase bullets finish the job quickly.
  const busted = page.locator(".busted-title");
  const fight = page.getByTestId("btn-fight-boss");
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await busted.isVisible().catch(() => false)) break;
    if (await fight.isVisible().catch(() => false)) {
      await fight.click().catch(() => {});
    }
    await page.waitForTimeout(1_000);
  }

  await expect(busted).toBeVisible({ timeout: 5_000 });
  await expect(busted).toContainText("BUSTED");

  // Capture GameOver screenshot (reused by C-6 matrix)
  const outDir = path.resolve(__dirname, "..", "smoke-screenshots");
  await page.screenshot({
    path: path.join(outDir, `gameover-${testInfo.project.name}.png`),
    fullPage: true,
  });

  // Click RETRY -> goes back to playing canvas (startGame path which resets lives to 3).
  // Retry resets stage to the startStageNum, which was forced to 4, so the game re-enters stage 4 canvas.
  await page.getByTestId("btn-retry").click();
  await expect(page.getByTestId("game-canvas")).toBeVisible({ timeout: 10_000 });
  // Verify we are alive again in the new session
  const debug = page.getByTestId("debug-panel");
  await expect(debug).toContainText("lives: 3", { timeout: 10_000 });
});
