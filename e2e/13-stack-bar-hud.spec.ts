import { test, expect, Page } from "@playwright/test";

// v2 Sprint 2 Commit 5: スタックバー HUD 数値 + チップパーティクル吸い込み + 初期 state リーク確認
// 動的検証: 中間 Audit #5 + #7 をカバー
// strategy: ボス HP を直接書き込み、stack 値を観測

type GsBoss = {
  hp: number;
  maxHp: number;
  stackBB?: number;
  chipLeaderPhase?: 1 | 2 | 3;
  sunglassesAlpha?: number;
  oneOuterUsed?: boolean;
};
type GsChipParticle = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  kind: "to-player" | "to-boss";
};
type GsShape = {
  boss: GsBoss | null;
  playerStackBB?: number;
  chipParticles?: GsChipParticle[];
  player: { x: number; y: number; invincible: number };
};

async function reachBoss(page: Page) {
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("btn-fight-boss").click();
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return gs?.boss?.chipLeaderPhase !== undefined;
    },
    { timeout: 10_000 }
  );
  // プレイヤー invincible 化 (boss 弾で死なないようにする)
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.player) gs.player.invincible = 999_999;
  });
}

// 13-A: Stage 4 開始時の初期スタック値
//   hpRatio=1.0 → playerStackBB ≈ 20 (player 絶望 / boss leading)
//   playerStackBB + bossStackBB = 120 (ゼロサム)
//   初期 state: phase=1, sunglassesAlpha=1, oneOuterUsed=undefined (Stage 4 のみ)
test("13-A Stage 4 initial stack: player ≈ 20BB, boss ≈ 100BB (zero-sum)", async ({ page }) => {
  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0&stackLerp=1");
  await reachBoss(page);

  // 1 frame 進行 (stackLerp=1 なので即追従)
  await page.waitForTimeout(100);
  const snap = await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    return {
      playerStack: gs?.playerStackBB ?? null,
      bossStack: gs?.boss?.stackBB ?? null,
      phase: gs?.boss?.chipLeaderPhase ?? null,
      sunglassesAlpha: gs?.boss?.sunglassesAlpha ?? null,
      oneOuterUsed: gs?.boss?.oneOuterUsed ?? null,
    };
  });
  expect(snap.playerStack).not.toBeNull();
  expect(snap.bossStack).not.toBeNull();
  // 初期: player ≈ 20、boss ≈ 100
  expect(snap.playerStack!).toBeGreaterThan(15);
  expect(snap.playerStack!).toBeLessThan(35);
  expect(snap.bossStack!).toBeGreaterThan(85);
  expect(snap.bossStack!).toBeLessThan(105);
  // ゼロサム不変条件 (誤差 ±2)
  expect(Math.abs((snap.playerStack! + snap.bossStack!) - 120)).toBeLessThan(3);
  // 初期状態の検証 (Stage 切替時 state リーク防止 — 新規 boss は常にここからスタート)
  expect(snap.phase).toBe(1);
  expect(snap.sunglassesAlpha).toBe(1);
  // Stage 4 (CHIP LEADER) は oneOuterUsed=undefined (Stage 3 のみ false 初期化)
  expect(snap.oneOuterUsed).toBeNull();
});

// 13-B: HP 減少に伴う stack 反転 (player が boss を逆転リード)
//   ボス HP を 30% に書き込み → stack が逆転
test("13-B player stack overtakes boss as HP drops", async ({ page }) => {
  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0&stackLerp=1");
  await reachBoss(page);

  // ボス HP を 30% に書き込み → updateChipLeaderStack で playerStack > bossStack
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * 0.3;
  });

  // stack 逆転待ち
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      const ps = gs?.playerStackBB ?? 0;
      const bs = gs?.boss?.stackBB ?? 0;
      return ps > bs;
    },
    { timeout: 5_000 }
  );

  const snap = await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    return {
      playerStack: gs?.playerStackBB ?? null,
      bossStack: gs?.boss?.stackBB ?? null,
    };
  });
  expect(snap.playerStack!).toBeGreaterThan(snap.bossStack!);
  // ゼロサム維持確認
  expect(Math.abs((snap.playerStack! + snap.bossStack!) - 120)).toBeLessThan(3);
});

// 13-C: Phase 転換時のチップパーティクル "to-player" 吸い込み
//   ボス HP を 50% に書き込み → Phase 1→2 遷移 → spawnChipBurst(20, "to-player")
//   target が player 位置 (CANVAS_W/2 = 240, CANVAS_H-140 = 580) に正確に収束
test("13-C chip particles spawn on phase transition with to-player target", async ({ page }) => {
  await page.goto("/?stage=4&quick=1&debug=1&fxDuration=0&phaseImmuneMs=200");
  await reachBoss(page);

  // ボス HP を 50% (Phase 2 範囲) に書き込み → 次フレームで Phase 1→2 遷移発火
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * 0.5;
  });

  // Phase 2 到達待ち
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return (gs?.boss?.chipLeaderPhase ?? 0) >= 2;
    },
    { timeout: 5_000 }
  );

  // 直後の chipParticles 観測 (60 frame ≈ 1s 内で max 長を記録)
  const observed = await page.evaluate(async () => {
    return new Promise<{ maxLen: number; toPlayerCount: number; samples: Array<{ x: number; y: number; tx: number; ty: number; kind: string }> }>((resolve) => {
      let maxLen = 0;
      let toPlayerCount = 0;
      let samples: Array<{ x: number; y: number; tx: number; ty: number; kind: string }> = [];
      let frames = 0;
      const tick = () => {
        const gs = (window as unknown as { __gs?: GsShape }).__gs;
        const cp = gs?.chipParticles ?? [];
        if (cp.length > maxLen) {
          maxLen = cp.length;
          toPlayerCount = cp.filter((p) => p.kind === "to-player").length;
          samples = cp.slice(0, 5).map((p) => ({ x: p.x, y: p.y, tx: p.targetX, ty: p.targetY, kind: p.kind }));
        }
        frames++;
        if (frames < 60) requestAnimationFrame(tick);
        else resolve({ maxLen, toPlayerCount, samples });
      };
      requestAnimationFrame(tick);
    });
  });

  // Phase 転換時の chipBurst で 20 粒以上 spawn されているはず
  expect(observed.maxLen).toBeGreaterThanOrEqual(15);
  expect(observed.toPlayerCount).toBeGreaterThan(0);
  // target は constants で固定: PLAYER_HUD_TARGET_X=240, PLAYER_HUD_TARGET_Y=580
  for (const s of observed.samples.filter((p) => p.kind === "to-player")) {
    expect(s.tx).toBe(240);
    expect(s.ty).toBe(580);
  }
});
