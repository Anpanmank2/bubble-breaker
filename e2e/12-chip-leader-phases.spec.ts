import { test, expect, Page } from "@playwright/test";

// v2 Sprint 2 Commit 5: CHIP LEADER (Stage 4) Phase 遷移 + 被弾無効 + サングラス軌道 + 60fps
// 動的検証: 中間 Audit #1 / #2 / #4 をカバー
// observation: window.__gs (debug=1 の時のみ Game.tsx loop で公開)
// strategy: ボス HP を直接 __gs.boss.hp に書き込んで Phase 遷移を deterministic に発火

type GsBoss = {
  hp: number;
  maxHp: number;
  chipLeaderPhase?: 1 | 2 | 3;
  sunglassesY?: number;
  sunglassesVy?: number;
  sunglassesAlpha?: number;
  sunglassesBlowoffLife?: number;
};
type GsPlayer = { x: number; y: number; invincible: number };
type GsShape = {
  boss: GsBoss | null;
  phaseTransition?: { kind: string; life: number; maxLife: number };
  phaseImmuneRemain?: number;
  player: GsPlayer;
  enemyBullets: Array<{ x: number; y: number; vx: number; vy: number }>;
};

async function reachBoss(page: Page) {
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("btn-fight-boss").click();
  await expect(page.getByTestId("debug-panel")).toBeVisible();
  // Wait until game loop has populated window.__gs.boss (CHIP LEADER spawned)
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return gs?.boss?.chipLeaderPhase !== undefined;
    },
    { timeout: 10_000 }
  );
  // プレイヤーが boss 弾で死なないように invincible 化
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.player) gs.player.invincible = 999_999;
  });
}

async function readLives(page: Page): Promise<number> {
  const text = await page.getByTestId("debug-panel").innerText();
  const m = text.match(/lives:\s*(\d+)/);
  if (!m) throw new Error(`debug-panel lives not found: ${text}`);
  return parseInt(m[1], 10);
}

// 12-A: Phase 1→2 (EVEN_STACK) 発火 + 被弾無効中の lives 不変
//   ボス HP を 50% に強制 → 次フレームで Phase 2 遷移 → EVEN_STACK 発火 + phaseImmuneRemain 設定
//   immune 中に強制弾を player に注入し lives が減らないことを実測
test("12-A Phase 1→2 EVEN_STACK fires and lives unchanged during phaseImmune", async ({ page }) => {
  // evenStackMs=2000 で transition life を観測可能にしておく (fxDuration=0 デフォルト override)
  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0&phaseImmuneMs=2000&evenStackMs=2000");
  await reachBoss(page);

  // ボス HP を 50% に書き込み → 次フレームで Phase 1→2 遷移
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * 0.5;
  });

  // Phase 2 到達 + EVEN_STACK 発火待ち
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return gs?.boss?.chipLeaderPhase === 2 && (gs?.phaseImmuneRemain ?? 0) > 0;
    },
    { timeout: 5_000 }
  );

  const snap = await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    return {
      transitionKind: gs?.phaseTransition?.kind ?? null,
      immuneRemain: gs?.phaseImmuneRemain ?? 0,
      phase: gs?.boss?.chipLeaderPhase ?? null,
    };
  });
  expect(snap.phase).toBe(2);
  expect(snap.transitionKind).toBe("EVEN_STACK");
  expect(snap.immuneRemain).toBeGreaterThan(0);

  // invincible を 0 に戻して isPhaseImmune だけが防御源になる状態を作る
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.player) gs.player.invincible = 0;
  });

  // 被弾無効中: 強制弾を player 直撃で注入
  const livesBefore = await readLives(page);
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (!gs) return;
    for (let i = 0; i < 5; i++) {
      gs.enemyBullets.push({ x: gs.player.x, y: gs.player.y, vx: 0, vy: 0 });
    }
  });
  // 30 frame ≒ 500ms 待機 (phaseImmuneMs=2000 内)
  await page.waitForTimeout(500);
  const livesAfter = await readLives(page);
  expect(livesAfter).toBe(livesBefore);
});

// 12-B: Phase 1→3 直接遷移 (大ダメージ scenario) で CHIP_LEAD_CHANGE 発火 + サングラス放物線
test("12-B CHIP_LEAD_CHANGE triggers sunglasses blowoff with parabolic vy", async ({ page }) => {
  // chipLeadChangeMs=2000 で transition life 観測可能 (fxDuration=0 override)
  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0&phaseImmuneMs=400&chipLeadChangeMs=2000");
  await reachBoss(page);

  // ボス HP を 10% に直接書き込み → 次フレームで Phase 1→3 直接遷移 → CHIP_LEAD_CHANGE 発火
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * 0.1;
  });

  // Phase 3 到達待ち
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return gs?.boss?.chipLeaderPhase === 3 && (gs?.boss?.sunglassesBlowoffLife ?? 0) > 0;
    },
    { timeout: 5_000 }
  );

  // サングラス吹っ飛び初期状態 (vy=-8 直後 → 重力で増加していく)
  const t0 = await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    return {
      vy: gs?.boss?.sunglassesVy ?? null,
      y: gs?.boss?.sunglassesY ?? null,
      alpha: gs?.boss?.sunglassesAlpha ?? null,
      life: gs?.boss?.sunglassesBlowoffLife ?? null,
      transitionKind: gs?.phaseTransition?.kind ?? null,
    };
  });
  expect(t0.transitionKind).toBe("CHIP_LEAD_CHANGE");
  expect(t0.life).toBeGreaterThan(0);
  expect(t0.vy).toBeLessThan(0); // 上向き初速 = 負

  // 200ms 後 (≈12 frame) 重力で vy 増加 + alpha 減少
  await page.waitForTimeout(200);
  const t1 = await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    return {
      alpha: gs?.boss?.sunglassesAlpha ?? null,
      life: gs?.boss?.sunglassesBlowoffLife ?? null,
      vy: gs?.boss?.sunglassesVy ?? null,
    };
  });
  // life > 0 の間に観測した条件下で物理が正しい方向に進む
  if ((t0.life ?? 0) > 0 && (t1.life ?? 0) > 0) {
    if (t0.alpha !== null && t1.alpha !== null) {
      expect(t1.alpha).toBeLessThanOrEqual(t0.alpha);
    }
    if (t0.vy !== null && t1.vy !== null) {
      expect(t1.vy).toBeGreaterThan(t0.vy);
    }
  }
});

// 12-C: 60fps 維持 — boss 戦中の rAF 平均 fps を window.__fpsFrame で計測
//   bossHpScale 無指定 (full 1200 HP) で boss が長期生存
//   reachBoss で player invincible 化 → 死亡で loop 停止しない
test("12-C boss fight rAF maintains > 50 fps average over 3s", async ({ page }, testInfo) => {
  // mobile-390 のみで実行 (CI 環境依存の flaky 抑制)
  test.skip(testInfo.project.name !== "mobile-390", "FPS sample only on mobile-390");

  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0");
  await reachBoss(page);

  // FPS サンプリング: 3 秒間の rAF 回数 / 3
  const start = await page.evaluate(() => {
    return (window as unknown as { __fpsFrame?: number }).__fpsFrame ?? 0;
  });
  await page.waitForTimeout(3000);
  const end = await page.evaluate(() => {
    return (window as unknown as { __fpsFrame?: number }).__fpsFrame ?? 0;
  });
  const fps = (end - start) / 3;
  // 中間 Audit 5 パーセンタイル基準 50 を閾値に採用 (60 fps target)
  expect(fps).toBeGreaterThan(50);
});
