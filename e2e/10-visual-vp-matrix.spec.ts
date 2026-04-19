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

// v2 Sprint 2 Commit 5: 縦画面化 + CHIP LEADER (Stage 4) Phase 1/2/3 visual capture
// debug=1 で window.__gs を露出し、ボス HP を直接書き込んで Phase を deterministic に再現

type GsBossLite = { hp: number; maxHp: number; chipLeaderPhase?: 1 | 2 | 3 };
type GsLite = {
  boss: GsBossLite | null;
  player: { x: number; y: number; invincible: number };
};

async function reachStage4Boss(page: import("@playwright/test").Page) {
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("btn-fight-boss").click();
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsLite }).__gs;
      return gs?.boss?.chipLeaderPhase !== undefined;
    },
    { timeout: 10_000 }
  );
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsLite }).__gs;
    if (gs?.player) gs.player.invincible = 999_999;
  });
}

async function setBossHpRatio(page: import("@playwright/test").Page, ratio: number, expectedPhase: 1 | 2 | 3) {
  await page.evaluate((r: number) => {
    const gs = (window as unknown as { __gs?: GsLite }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * r;
  }, ratio);
  await page.waitForFunction(
    (target: number) => {
      const gs = (window as unknown as { __gs?: GsLite }).__gs;
      return gs?.boss?.chipLeaderPhase === target;
    },
    expectedPhase,
    { timeout: 5_000 }
  );
  // 演出が安定するまで 200ms 待機 (Phase 転換チップバースト等)
  await page.waitForTimeout(200);
}

test("C-6c Stage 4 Phase 1 (CHIP LEADER intact) captured per viewport", async ({ page }, testInfo) => {
  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0");
  await reachStage4Boss(page);
  // Phase 1: HP 100%
  await page.screenshot({
    path: path.join(outDir, `chip-leader-phase1-${testInfo.project.name}.png`),
    fullPage: true,
  });
});

test("C-6d Stage 4 Phase 2 (EVEN STACK / sweat / cracked) captured per viewport", async ({ page }, testInfo) => {
  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0&phaseImmuneMs=200");
  await reachStage4Boss(page);
  await setBossHpRatio(page, 0.5, 2);
  await page.screenshot({
    path: path.join(outDir, `chip-leader-phase2-${testInfo.project.name}.png`),
    fullPage: true,
  });
});

test("C-6e Stage 4 Phase 3 (CHIP LEAD CHANGE / panic / sunglasses gone) captured per viewport", async ({ page }, testInfo) => {
  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0&phaseImmuneMs=200");
  await reachStage4Boss(page);
  await setBossHpRatio(page, 0.1, 3);
  await page.screenshot({
    path: path.join(outDir, `chip-leader-phase3-${testInfo.project.name}.png`),
    fullPage: true,
  });
});
