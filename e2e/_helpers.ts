import type { Page } from "@playwright/test";

// v2 Sprint 2 hot-fix (2026-04-19): 縦画面化でプレイヤー stationary だと
// boss の x 振動に弾が届かず C-2/C-4 e2e が regression。
// 本 helper は debug=1 で公開された window.__gs 経由で player input を
// boss x に追従注入する。本来のゲームプレイ動作を e2e で再現する。
//
// 必須: 呼び出し前に URL に `?debug=1` を含めること
//       (Game.tsx loop が window.__gs / window.__fpsFrame を更新する条件)

type GsTracking = {
  boss: { x: number; w: number } | null;
  player: { y: number };
  inputX: number;
  inputY: number;
  inputActive: boolean;
};

type WindowWithTracker = Window & {
  __gs?: GsTracking;
  __trackerId?: ReturnType<typeof setInterval>;
};

/**
 * boss x に追従する player input を 50ms 間隔で注入する
 * インターバルは page navigation で自動破棄、または stopTrackingBossX で明示停止可
 */
export async function trackBossX(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as WindowWithTracker;
    // 既存 tracker があれば 1 度クリア (再呼出しの idempotency)
    if (w.__trackerId) clearInterval(w.__trackerId);
    w.__trackerId = setInterval(() => {
      const gs = w.__gs;
      if (!gs?.boss) return;
      gs.inputActive = true;
      gs.inputX = gs.boss.x + gs.boss.w / 2;
      gs.inputY = gs.player.y;
    }, 50);
  });
}

export async function stopTrackingBossX(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as WindowWithTracker;
    if (w.__trackerId) {
      clearInterval(w.__trackerId);
      w.__trackerId = undefined;
    }
    if (w.__gs) w.__gs.inputActive = false;
  });
}
