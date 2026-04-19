// v2 Sprint 3 Track A Phase 2: CHIP LEADER 描画最適化 + 品質向上
// 藤井 蓮 (eng-05) Web Designer / Art Director
//
// 最適化戦略: Phase 不変レイヤーをオフスクリーン Canvas にキャッシュし、
// 毎フレームの描画 call 数を 11 → 4-5 に削減する。
// Phase 切替タイミング (intact/cracked/broken) でのみキャッシュを再生成。
//
// 品質向上:
//   - タキシード襟: lineWidth=0.5 outline で立体感
//   - バッグ札 ($): ffd700→ffed00 gradient で立体感
//   - 顔の肌: d4a877 縁取り 2px で奥行き
//   - 髪 Phase 3: 毛先 5 pos にハイライト点 (1px #fff)

import type { Boss } from "../state/GameState";
import { CHIP_LEADER_COLORS } from "../characters/constants";

const LEGACY_BBOX_W = 50;
const CACHE_W = 120; // Boss の実サイズに合わせたキャッシュ canvas 幅
const CACHE_H = 140; // 同 高さ

// module-level キャッシュ。key = "intact" | "cracked" | "broken"
// SSR 環境 (document undefined) では Map は存在するが canvas 生成をスキップし
// キャッシュ HIT しない状態を維持 → 従来パスへフォールバック
const cache = new Map<string, HTMLCanvasElement>();

type PhaseKey = "intact" | "cracked" | "broken";

function phaseKey(b: Boss): PhaseKey {
  if (b.accessoryState === "cracked") return "cracked";
  if (b.accessoryState === "broken") return "broken";
  return "intact";
}

/**
 * Phase に対応するオフスクリーン Canvas を返す。
 * 未生成の場合は描画してキャッシュに格納する。
 * SSR 環境では null を返す。
 */
function getPhaseCache(b: Boss): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;

  const key = phaseKey(b);
  if (cache.has(key)) return cache.get(key)!;

  const offscreen = document.createElement("canvas");
  offscreen.width = CACHE_W;
  offscreen.height = CACHE_H;
  const ctx = offscreen.getContext("2d");
  if (!ctx) return null;

  // オフスクリーン座標系: 左上 (0,0) → 中心 (60, 70) を cx/cy として描画
  const cx = CACHE_W / 2;
  const cy = CACHE_H / 2;

  // scale: LEGACY_BBOX_W=50 前提の座標を CACHE_W=120 に合わせる
  const scale = CACHE_W / LEGACY_BBOX_W;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  // 静的レイヤーのみキャッシュに描画
  // Layer 3: タキシード (Phase 3 で 3deg 回転は変化するが Phase 切替時のみ再生成でOK)
  drawTuxedoCached(ctx, cx, cy + 12, b);
  // Layer 4: マネーバッグ
  drawMoneyBagsCached(ctx, cx, cy + 18);
  // Layer 5: 首
  drawNeckCached(ctx, cx, cy + 2);
  // Layer 6: 蝶ネクタイ
  drawBowtieCached(ctx, cx, cy + 6, b);
  // Layer 7: 顔
  drawFaceCached(ctx, cx, cy - 4, b);
  // Layer 8: 髪
  drawHairCached(ctx, cx, cy - 14, b);
  // Layer 11: チップ山
  drawChipPileCached(ctx, cx, cy + 25 + 2);

  ctx.restore();

  cache.set(key, offscreen);
  return offscreen;
}

/**
 * キャッシュを強制クリア (Phase 切替時に外部から呼ぶ場合の備え)。
 * drawChipLeader 内で自動的に管理するため、通常は呼び出し不要。
 */
export function invalidateChipLeaderCache(): void {
  cache.clear();
}

// ===== メイン描画関数 (Renderer.ts からの呼び出し口。引数互換維持) =====

const AURA_RAINBOW = ["#ff00ff", "#ffd700", "#00ffff", "#ff6b6b", "#4ecdc4"];

export function drawChipLeader(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  frameCount: number,
) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const scale = b.w / LEGACY_BBOX_W;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  // --- 動的 Layer 1: Aura (Phase 3 で虹色点滅) ---
  drawAura(ctx, cx, cy, b, frameCount);

  // --- 静的レイヤー一括: キャッシュから drawImage ---
  const cached = getPhaseCache(b);
  if (cached) {
    // キャッシュを Boss の bbox 左上に等倍で貼る
    // (scale transform 適用済みなので LEGACY 座標系で配置)
    const bboxX = cx - LEGACY_BBOX_W / 2;
    const bboxY = cy - (LEGACY_BBOX_W * CACHE_H / CACHE_W) / 2;
    const bboxH = LEGACY_BBOX_W * CACHE_H / CACHE_W;
    ctx.drawImage(cached, bboxX, bboxY, LEGACY_BBOX_W, bboxH);
  } else {
    // SSR フォールバック: 静的レイヤーを直接描画
    drawTuxedoCached(ctx, cx, cy + 12, b);
    drawMoneyBagsCached(ctx, cx, cy + 18);
    drawNeckCached(ctx, cx, cy + 2);
    drawBowtieCached(ctx, cx, cy + 6, b);
    drawFaceCached(ctx, cx, cy - 4, b);
    drawHairCached(ctx, cx, cy - 14, b);
    drawChipPileCached(ctx, cx, cy + 25 + 2);
  }

  // --- 動的 Layer 2: Banner (Phase 2 で jitter) ---
  drawBanner(ctx, cx, cy - 25 - 16, b, frameCount);

  // --- 動的 Layer 9: サングラス (吹っ飛びアニメ) ---
  drawSunglasses(ctx, cx, cy - 6, b);

  // --- 動的 Layer 10: 汗 (Phase 2/3 で変化) ---
  drawSweat(ctx, cx, cy - 10, b);

  ctx.restore();
}

// ===== 動的レイヤー (毎フレーム再描画) =====

function drawAura(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
  frame: number,
) {
  const colors = CHIP_LEADER_COLORS.phase1.aura;
  const phase3 = b.accessoryState === "broken";
  const rainbow = phase3
    ? AURA_RAINBOW[Math.floor(frame / 4) % AURA_RAINBOW.length]
    : colors;
  const radius = 32 + (phase3 ? 4 : 0);
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, radius);
  grad.addColorStop(0, rainbow + "cc");
  grad.addColorStop(1, rainbow + "00");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBanner(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  b: Boss,
  frame: number,
) {
  let jitter = 0;
  if (b.accessoryState === "cracked") jitter = frame % 2 === 0 ? 1 : -1;
  ctx.save();
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("★ CHIP LEADER ★", cx + jitter, y);
  if (b.accessoryState === "broken") {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, y - 2);
    ctx.lineTo(cx - 10, y - 6);
    ctx.lineTo(cx, y);
    ctx.lineTo(cx + 10, y - 6);
    ctx.lineTo(cx + 20, y - 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSunglasses(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
) {
  const alpha = b.sunglassesAlpha ?? 1;
  if (alpha <= 0) return;
  const yOffset = b.sunglassesY ?? 0;
  const rotation = b.sunglassesRotation ?? 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy + yOffset);
  ctx.rotate(rotation);
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.sunglasses;
  ctx.fillRect(-9, -2, 7, 4);
  ctx.fillRect(2, -2, 7, 4);
  ctx.fillRect(-2, -1, 4, 1);
  ctx.restore();
}

function drawSweat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
) {
  const count =
    b.accessoryState === "cracked"
      ? 1
      : b.accessoryState === "broken"
        ? 2
        : 0;
  if (count === 0) return;
  ctx.save();
  ctx.fillStyle = CHIP_LEADER_COLORS.phase2.sweat;
  const positions: Array<[number, number]> =
    count === 1 ? [[8, -2]] : [[-8, -2], [8, -2]];
  for (const [dx, dy] of positions) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy + dy - 3);
    ctx.quadraticCurveTo(cx + dx - 2, cy + dy, cx + dx, cy + dy + 2);
    ctx.quadraticCurveTo(cx + dx + 2, cy + dy, cx + dx, cy + dy - 3);
    ctx.fill();
  }
  ctx.restore();
}

// ===== キャッシュ対象の静的レイヤー (品質向上済み) =====

// Layer 3: タキシード — 襟に lineWidth=0.5 outline 追加で陰影
function drawTuxedoCached(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
) {
  const collarTilt = b.accessoryState === "broken" ? (3 * Math.PI) / 180 : 0;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(collarTilt);

  // 黒襟 (塗り)
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.tuxedo;
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.lineTo(0, 2);
  ctx.lineTo(12, -4);
  ctx.lineTo(10, 10);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();

  // 品質向上: 襟アウトライン (0.5px 細線で立体感)
  ctx.strokeStyle = "rgba(80,80,120,0.7)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 白シャツ
  ctx.fillStyle = "#fff";
  ctx.fillRect(-3, -2, 6, 10);

  // シャツの縦ライン (細部)
  ctx.strokeStyle = "rgba(200,200,200,0.6)";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, 8);
  ctx.stroke();

  ctx.restore();
}

// Layer 4: マネーバッグ — $ 文字に ffd700→ffed00 gradient で立体感
function drawMoneyBagsCached(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  ctx.save();
  for (const dx of [-15, 15]) {
    // バッグ本体: radial gradient で立体感
    const bagGrad = ctx.createRadialGradient(
      cx + dx - 1,
      cy - 1,
      0,
      cx + dx,
      cy,
      4,
    );
    bagGrad.addColorStop(0, "#ffed00");
    bagGrad.addColorStop(1, "#ffd700");
    ctx.fillStyle = bagGrad;
    ctx.beginPath();
    ctx.arc(cx + dx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // バッグ縁 (暗め)
    ctx.strokeStyle = "#c99700";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // $ テキスト
    ctx.fillStyle = "#000";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("$", cx + dx, cy + 2);
  }
  ctx.restore();
}

// Layer 5: 首
function drawNeckCached(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
) {
  ctx.save();
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.skin;
  ctx.fillRect(cx - 3, cy - 3, 6, 6);
  ctx.restore();
}

// Layer 6: 蝶ネクタイ (Phase 3 で -15deg 回転)
function drawBowtieCached(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
) {
  const rotation = b.accessoryState === "broken" ? (-15 * Math.PI) / 180 : 0;
  const yOffset = b.accessoryState === "broken" ? 2 : 0;
  ctx.save();
  ctx.translate(cx, cy + yOffset);
  ctx.rotate(rotation);
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.bowtie;
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.lineTo(-1, 0);
  ctx.lineTo(-5, 2);
  ctx.closePath();
  ctx.moveTo(5, -2);
  ctx.lineTo(1, 0);
  ctx.lineTo(5, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

// Layer 7: 顔 — 肌に d4a877 縁取り 2px で立体感
function drawFaceCached(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
) {
  ctx.save();

  // 品質向上: 肌の影縁 (2px, 少し暗めの肌色)
  ctx.fillStyle = "#d4a877";
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2); // 1px 外側
  ctx.fill();

  // 肌本体
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.skin;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();

  // 口の表情
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (b.faceState === "calm") {
    ctx.arc(cx, cy + 2, 3, 0.1 * Math.PI, 0.9 * Math.PI);
  } else if (b.faceState === "sweat") {
    ctx.moveTo(cx - 3, cy + 3);
    ctx.lineTo(cx + 3, cy + 3);
  } else {
    ctx.arc(cx, cy + 5, 3, -0.9 * Math.PI, -0.1 * Math.PI);
  }
  ctx.stroke();

  ctx.restore();
}

// Layer 8: 髪 — Phase 3 で毛先 5 pos にハイライト点 (1px #fff) を追加
function drawHairCached(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
) {
  ctx.save();
  ctx.fillStyle = CHIP_LEADER_COLORS.phase3.hair;

  if (b.accessoryState === "intact") {
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 8, Math.PI, 0);
    ctx.fill();
  } else if (b.accessoryState === "cracked") {
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 2, 8, Math.PI, 0);
    ctx.fill();
  } else {
    // Phase 3: 乱れ髪
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy + 2);
    ctx.quadraticCurveTo(cx - 5, cy - 11, cx, cy - 6);
    ctx.quadraticCurveTo(cx + 5, cy - 11, cx + 13, cy + 2);
    ctx.closePath();
    ctx.fill();

    // 品質向上: 毛先 5 点にハイライト
    const highlights: Array<[number, number]> = [
      [cx - 13, cy + 2],
      [cx - 7, cy - 9],
      [cx, cy - 6],
      [cx + 7, cy - 9],
      [cx + 13, cy + 2],
    ];
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (const [hx, hy] of highlights) {
      ctx.beginPath();
      ctx.arc(hx, hy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// Layer 11: チップ山 (台形積層)
function drawChipPileCached(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const w = 20 - i * 2;
    // 品質向上: 各チップに僅かに異なる金色のグラデーション
    const chipGrad = ctx.createLinearGradient(
      cx - w / 2,
      y - i * 2,
      cx + w / 2,
      y - i * 2,
    );
    chipGrad.addColorStop(0, "#ffd700");
    chipGrad.addColorStop(0.5, "#ffed00");
    chipGrad.addColorStop(1, "#ffd700");
    ctx.fillStyle = chipGrad;
    ctx.fillRect(cx - w / 2, y - i * 2, w, 2);
  }
  ctx.restore();
}

// テスト用エクスポート (chipLeaderFx.ts と互換)
export const __test__ = {
  AURA_RAINBOW,
  invalidateChipLeaderCache,
  phaseKey,
};
