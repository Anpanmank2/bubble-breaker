// v2 Sprint 4 Track A Phase 3: Stage 1-3 ボス SVG drawImage 描画
// 藤井 蓮 (eng-05) AD draft + 田中 健太 (eng-01) Tech design 準拠
// 旧 Canvas primitive 描画 (648 行) を全面廃棄 → SVG data URL + drawImage に置換
//
// 戦略:
//   - SVG 静的 path を HTMLImageElement cache (Map<key, Image>) で保持
//   - phase 別 (intact/cracked/broken) で別 SVG を使い、hp ratio で切替
//   - 登場演出 (0.5s scale bounce) を sinOffset 基準で frame 制御
//   - wobble や phase 別崩れ方向は Canvas primitive overlay で表現
//   - SSR 環境 (typeof Image === "undefined") は描画無効化 (test も同様)
//
// hp ratio の phase 判定 (characters/constants.ts の getBossPhase):
//   hp > 60%: "intact"
//   hp 30-60%: "cracked"
//   hp < 30%: "broken"

import type { Boss } from "../state/GameState";
import {
  STAGE_BOSS_SVG,
  STAGE_BOSS_COLORS,
  getBossPhase,
  type BossPhase,
} from "../characters/constants";

const _imgCache = new Map<string, HTMLImageElement>();

function _loadSvg(key: string, svgString: string): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  const cached = _imgCache.get(key);
  if (cached) return cached;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  _imgCache.set(key, img);
  return img;
}

/**
 * GameLoop 初期化時に呼ぶことで「初回フレーム非表示」問題を防ぐ。
 * 3 boss × 3 phase = 9 パターンを事前ロード。
 */
export function preloadBossSvg(): void {
  if (typeof Image === "undefined") return;
  for (const stageNum of [1, 2, 3] as const) {
    const svgMap = STAGE_BOSS_SVG[stageNum];
    if (!svgMap) continue;
    for (const phase of ["intact", "cracked", "broken"] as BossPhase[]) {
      _loadSvg(`stage${stageNum}-${phase}`, svgMap[phase]);
    }
  }
}

/**
 * Sprint 4: Stage 1-3 ボス SVG 描画エントリ。
 * Renderer.ts からの呼出 signature (ctx, b, stageNum, frameCount) は維持。
 * Stage 4 は drawChipLeader() (chipLeaderFx.ts) が継続担当。
 */
export function drawStageBoss(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  stageNum: number,
  frameCount: number,
): void {
  const svgMap = STAGE_BOSS_SVG[stageNum];
  if (!svgMap) return; // 未知 stage
  const phase = getBossPhase(b.hp, b.maxHp);
  const key = `stage${stageNum}-${phase}`;
  const img = _loadSvg(key, svgMap[phase]);

  // Phase 別 wobble 振幅
  const wobbleAmp = phase === "intact" ? 0 : phase === "cracked" ? 2 : 4;
  const wobble = wobbleAmp * Math.sin(frameCount * 0.15);

  // 登場演出 (初回 30 frame ≒ 0.5s @60fps) — Owner Gate 1 承認済
  // sinOffset は BossManager で毎フレーム +0.02 される → frame 換算は sinOffset * 50
  const appearElapsed = b.sinOffset * 50;
  const entryFrames = 30;
  let scaleMul = 1.0;
  let flashAlpha = 0;
  if (appearElapsed < entryFrames) {
    const t = appearElapsed / entryFrames;
    // cubic-bezier(0.34, 1.56, 0.64, 1) 近似 (0 → 1.1 → 1.0)
    scaleMul = t < 0.7 ? 0.1 + t * (1.1 - 0.1) / 0.7 : 1.1 - (t - 0.7) / 0.3 * 0.1;
    flashAlpha = Math.max(0, 0.6 * (1 - t));
  }

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    const cx = b.x + b.w / 2 + wobble;
    const cy = b.y + b.h / 2;
    const dw = b.w * scaleMul;
    const dh = b.h * scaleMul;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  }

  // 登場時の白フラッシュ (ボス周辺のみ、全画面を塞がない)
  if (flashAlpha > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
    ctx.fillRect(b.x - 20, b.y - 20, b.w + 40, b.h + 40);
    ctx.restore();
  }

  // ボス名ラベル (Canvas で描画 = SVG の text hinting 崩壊を回避)
  _drawBossLabel(ctx, b, stageNum);
}

function _drawBossLabel(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  stageNum: number,
): void {
  const colors = STAGE_BOSS_COLORS[stageNum as 1 | 2 | 3];
  if (!colors) return;
  const labels: Record<1 | 2 | 3, string> = {
    1: "DONK BET KING",
    2: "3-BET MONSTER",
    3: "SLOW PLAYER GOD",
  };
  const label = labels[stageNum as 1 | 2 | 3];
  if (!label) return;

  ctx.save();
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(0,0,0,0.7)";
  ctx.lineWidth = 3;
  ctx.strokeText(label, b.x + b.w / 2, b.y - 8);
  ctx.fillStyle = colors.accent;
  ctx.fillText(label, b.x + b.w / 2, b.y - 8);
  ctx.restore();
}

// test 用 export (vitest の mock 設計で参照)
export const __test__ = {
  _loadSvg,
  _imgCache,
  getBossPhase,
};
