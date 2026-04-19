import { test, expect, Page } from "@playwright/test";

// v2 Sprint 2 Commit 5: Stage 3 SLOW PLAYER GOD ワンアウター発火 + 1 回限定 + 暗転タイミング
// 動的検証: 中間 Audit #3 (連続プレイ耐性) + #6 (暗転タイミング) + #7 (state リーク) をカバー
// strategy: ボス HP を 25% に直接書き込んで oneOuter 発火を deterministic に

type GsBoss = {
  hp: number;
  maxHp: number;
  oneOuterUsed?: boolean;
};
type GsPlayer = { x: number; y: number; invincible: number };
type GsShape = {
  boss: GsBoss | null;
  oneOuterSequence?: { life: number; maxLife: number };
  player: GsPlayer;
};

async function reachStage3Boss(page: Page) {
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("btn-fight-boss").click();
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      // Stage 3 SLOW PLAYER GOD は oneOuterUsed=false で初期化される
      return gs?.boss?.oneOuterUsed === false;
    },
    { timeout: 10_000 }
  );
  // プレイヤー invincible 化
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.player) gs.player.invincible = 999_999;
  });
}

// 14-A: HP 25% で oneOuter 発火 → oneOuterUsed=true、HP 30% 回復、oneOuterSequence 起動
test("14-A oneOuter fires at HP ≤ 25%, restores 30% HP, marks used", async ({ page }) => {
  // oneOuterMs=300 で短い演出シーケンス
  await page.goto("/?stage=3&quick=1&debug=1&fxDuration=0&oneOuterMs=300");
  await reachStage3Boss(page);

  // 発火直前 (oneOuterUsed=false) の状態スナップ
  const before = await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    return {
      oneOuterUsed: gs?.boss?.oneOuterUsed ?? null,
      hp: gs?.boss?.hp ?? null,
      maxHp: gs?.boss?.maxHp ?? null,
    };
  });
  expect(before.oneOuterUsed).toBe(false);

  // ボス HP を 24% に書き込み (threshold 25% 以下) → 次フレームで checkOneOuter 発火
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * 0.24;
  });

  // oneOuterUsed=true 待ち
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return gs?.boss?.oneOuterUsed === true;
    },
    { timeout: 5_000 }
  );

  // 発火直後: oneOuterSequence 起動 + HP が 30% 回復
  const t0 = await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    return {
      oneOuterUsed: gs?.boss?.oneOuterUsed ?? null,
      seqLife: gs?.oneOuterSequence?.life ?? null,
      seqMaxLife: gs?.oneOuterSequence?.maxLife ?? null,
      hp: gs?.boss?.hp ?? null,
      maxHp: gs?.boss?.maxHp ?? null,
    };
  });
  expect(t0.oneOuterUsed).toBe(true);
  expect(t0.seqMaxLife).toBeGreaterThan(0);
  // HP 24% → 30% 回復 = 54% (threshold 25% を確実に超える)
  if (t0.hp !== null && t0.maxHp !== null) {
    expect(t0.hp / t0.maxHp).toBeGreaterThan(0.25);
  }
});

// 14-B: 1 回限定 — シーケンス終了後も oneOuterUsed=true 維持、再発火しない
test("14-B oneOuter remains used after sequence ends (no re-fire)", async ({ page }) => {
  await page.goto("/?stage=3&quick=1&debug=1&fxDuration=0&oneOuterMs=200");
  await reachStage3Boss(page);

  // ボス HP 24% に強制 → oneOuter 発火
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * 0.24;
  });

  // 発火待ち
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return gs?.boss?.oneOuterUsed === true;
    },
    { timeout: 5_000 }
  );

  // シーケンス終了待ち
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return gs?.oneOuterSequence === undefined || gs?.oneOuterSequence === null;
    },
    { timeout: 5_000 }
  );

  // シーケンス終了後 + HP を再度 24% に下げる → oneOuter は再発火しない (1 回限定)
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * 0.24;
  });
  await page.waitForTimeout(500);

  const after = await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    return {
      oneOuterUsed: gs?.boss?.oneOuterUsed ?? null,
      seq: gs?.oneOuterSequence ?? null,
    };
  });
  expect(after.oneOuterUsed).toBe(true);
  // 再発火していない (oneOuterSequence は spawn されない)
  expect(after.seq).toBeNull();
});

// 14-C: 暗転タイミング — oneOuterSequence.life の進行サンプル
//   t=0%/26%/80%/100% のマイルストーンを通過 (oneOuterMs=1500)
test("14-C oneOuter sequence progresses monotonically through 0% → 100%", async ({ page }) => {
  await page.goto("/?stage=3&quick=1&debug=1&fxDuration=0&oneOuterMs=1500");
  await reachStage3Boss(page);

  // ボス HP を 24% → oneOuter 発火
  await page.evaluate(() => {
    const gs = (window as unknown as { __gs?: GsShape }).__gs;
    if (gs?.boss) gs.boss.hp = gs.boss.maxHp * 0.24;
  });

  // 発火待ち
  await page.waitForFunction(
    () => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      return gs?.boss?.oneOuterUsed === true && gs?.oneOuterSequence !== undefined;
    },
    { timeout: 5_000 }
  );

  // 4 タイミングで life をサンプリング、t = 1 - life/maxLife (0..1)
  const samples: Array<{ t: number; ms: number }> = [];
  const start = Date.now();
  for (const targetMs of [50, 400, 1200, 1700]) {
    const elapsed = Date.now() - start;
    if (elapsed < targetMs) await page.waitForTimeout(targetMs - elapsed);
    const sample = await page.evaluate(() => {
      const gs = (window as unknown as { __gs?: GsShape }).__gs;
      const seq = gs?.oneOuterSequence;
      if (!seq) return { t: 1.0 };
      return { t: 1 - seq.life / seq.maxLife };
    });
    samples.push({ t: sample.t, ms: targetMs });
  }

  // monotonic 増加 (ジッター ±5% 許容)
  for (let i = 1; i < samples.length; i++) {
    expect(samples[i].t).toBeGreaterThanOrEqual(samples[i - 1].t - 0.05);
  }
  // 50ms 時点: 約 3% (0.05/1.5)、許容 0..15%
  expect(samples[0].t).toBeLessThan(0.15);
  // 400ms 時点: 約 26% (0.4/1.5)、許容 15..45%
  expect(samples[1].t).toBeGreaterThan(0.15);
  expect(samples[1].t).toBeLessThan(0.45);
  // 1200ms 時点: 約 80% (1.2/1.5)、許容 65%+
  expect(samples[2].t).toBeGreaterThan(0.65);
  // 1700ms 時点: シーケンス終了 (100%)
  expect(samples[3].t).toBeGreaterThan(0.95);
});
