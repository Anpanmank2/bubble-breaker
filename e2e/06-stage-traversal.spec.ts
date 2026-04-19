import { test, expect } from "@playwright/test";
import path from "node:path";
import { trackBossX } from "./_helpers";

// C-1: Stage 1 boss kill traversal (forced FOUR_OF_A_KIND)
// ENTRY -> collect ~2s (quick) -> HandReveal with FOUR -> FIGHT BOSS -> boss dies -> auto-advance to Stage 2
test("C-1 stage 1 clears with forced four-of-a-kind and advances to stage 2", async ({ page }) => {
  await page.goto("/?test=four&quick=1&debug=1");
  await page.getByTestId("btn-entry").click();
  // collect phase -> handReveal (quick=1 => ~2s collectDuration)
  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("btn-fight-boss").click();

  // boss phase begins; debug panel should report screen=boss then transition to stage 2 (screen=playing)
  const debug = page.getByTestId("debug-panel");
  await expect(debug).toBeVisible();

  // Wait for boss to die and stage to advance. With AAAAK × 5.0 = ~395 damage per hit on
  // Stage 1 boss (HP 300), boss should die within a few seconds. Then onBossDefeated
  // schedules a 1s setTimeout to startStage(2). Allow up to 20s budget.
  await expect(debug).toContainText("stage: 2", { timeout: 20_000 });
});

// C-2: Stage 4 final boss kill -> CHAMPION screen
test("C-2 forced four-of-a-kind on stage 4 reaches CHAMPION screen", async ({ page }, testInfo) => {
  await page.goto("/?stage=4&test=four&quick=1&debug=1");
  await page.getByTestId("btn-entry").click();

  // collect -> handReveal
  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("btn-fight-boss").click();

  // v2 Sprint 2 hot-fix: 縦画面化で player stationary だと boss x 振動に弾が届かない
  // → boss x 追従 input を window.__gs 経由で注入 (debug=1 必須)
  await trackBossX(page);

  // Stage 4 boss has 1200 HP. AAAAK × 5.0 = ~395 handPower; 0.15 multiplier in Game.tsx = ~59/bullet @ ~7.5Hz.
  // Need to wait long enough for the boss to die (~20-40s), then the 500ms clear-transition timeout.
  await expect(page.locator(".champion-title")).toBeVisible({ timeout: 50_000 });

  // Capture CHAMPION screenshot (reused by C-6 matrix)
  const outDir = path.resolve(__dirname, "..", "smoke-screenshots");
  await page.screenshot({
    path: path.join(outDir, `champion-${testInfo.project.name}.png`),
    fullPage: true,
  });
});
