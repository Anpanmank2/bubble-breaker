// v2 Sprint 2 Commit 3 / Sprint 3 Track A: CHIP LEADER (Stage 4 ボス) 11 レイヤー描画
// 藤井 art-direction §2-3 / §6 準拠:
// Phase 1 intact (余裕) → Phase 2 cracked (汗+サングラスずれ) → Phase 3 broken (サングラス吹っ飛び+髪乱れ)
// Sprint 3: boss.w が 50→120 に拡大したため、レガシーの 50×50 bbox 座標系を scale factor で新サイズに適応。
// 各 drawLayer 内のハードコード (radius 8、offset ±15 等) を変更せず、ctx.scale でまとめて拡大。

import type { Boss } from "../state/GameState";
import { CHIP_LEADER_COLORS } from "../characters/constants";

/**
 * drawChipLeader は 11 レイヤーを順次描画する。
 * Layer 1 (背面) → Layer 11 (前景) のzorder。
 */
const LEGACY_BBOX_W = 50; // レガシー座標系の基準幅 (Sprint 2 当時の boss.w)

export function drawChipLeader(ctx: CanvasRenderingContext2D, b: Boss, frameCount: number) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const scale = b.w / LEGACY_BBOX_W;

  ctx.save();
  // 中心基準で scale 適用。各 drawLayer 内のハードコード座標は LEGACY_BBOX_W=50 前提のまま残す。
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  // scale は transform 全体に適用されるため、各 drawLayer の座標はレガシー bbox (50×50) 基準のまま。
  // Banner / ChipPile は旧 boss.w=50, h=50 想定で ±28 px 近辺を渡す (b.y-16 → cy-(50/2)-16 = cy-41 相当)
  // 新 bbox でもこの位置指定のまま transform 下で描画することで全体が scale 倍に自然拡大される。
  drawAura(ctx, cx, cy, b, frameCount);           // 1
  drawBanner(ctx, cx, cy - 25 - 16, b, frameCount); // 2: レガシー bbox 上端 (cy-25) から 16px 上
  drawTuxedo(ctx, cx, cy + 12, b);                // 3
  drawMoneyBags(ctx, cx, cy + 18);                // 4
  drawNeck(ctx, cx, cy + 2);                      // 5
  drawBowtie(ctx, cx, cy + 6, b);                 // 6
  drawFace(ctx, cx, cy - 4, b);                   // 7
  drawHair(ctx, cx, cy - 14, b);                  // 8
  drawSunglasses(ctx, cx, cy - 6, b);             // 9
  drawSweat(ctx, cx, cy - 10, b);                 // 10
  drawChipPile(ctx, cx, cy + 25 + 2); // 11: レガシー bbox 下端 (cy+25) から 2px 下
  ctx.restore();
}

// Layer 1: 金色 / 虹色オーラ (Phase 3 で虹色点滅)
function drawAura(ctx: CanvasRenderingContext2D, cx: number, cy: number, b: Boss, frame: number) {
  const colors = CHIP_LEADER_COLORS.phase1.aura;
  const phase3 = b.accessoryState === "broken";
  const rainbow = phase3 ? AURA_RAINBOW[Math.floor(frame / 4) % AURA_RAINBOW.length] : colors;
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

const AURA_RAINBOW = ["#ff00ff", "#ffd700", "#00ffff", "#ff6b6b", "#4ecdc4"];

// Layer 2: 頭上バナー "CHIP LEADER" (Phase 2 で振動、Phase 3 で亀裂)
function drawBanner(ctx: CanvasRenderingContext2D, cx: number, y: number, b: Boss, frame: number) {
  let jitter = 0;
  if (b.accessoryState === "cracked") jitter = (frame % 2 === 0 ? 1 : -1);
  ctx.save();
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("★ CHIP LEADER ★", cx + jitter, y);
  if (b.accessoryState === "broken") {
    // 亀裂 zigzag 線
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

// Layer 3: タキシード (襟 + 白シャツ)
function drawTuxedo(ctx: CanvasRenderingContext2D, cx: number, cy: number, b: Boss) {
  const collarTilt = b.accessoryState === "broken" ? 3 * Math.PI / 180 : 0;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(collarTilt);
  // 黒襟
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.tuxedo;
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.lineTo(0, 2);
  ctx.lineTo(12, -4);
  ctx.lineTo(10, 10);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();
  // 白シャツ
  ctx.fillStyle = "#fff";
  ctx.fillRect(-3, -2, 6, 10);
  ctx.restore();
}

// Layer 4: 両手バッグ札 ($)
function drawMoneyBags(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = "#ffd700";
  for (const dx of [-15, 15]) {
    ctx.beginPath();
    ctx.arc(cx + dx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("$", cx + dx, cy + 2);
    ctx.fillStyle = "#ffd700";
  }
  ctx.restore();
}

// Layer 5: 首
function drawNeck(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.skin;
  ctx.fillRect(cx - 3, cy - 3, 6, 6);
  ctx.restore();
}

// Layer 6: 蝶ネクタイ (Phase 3 で -15度回転 + y+2)
function drawBowtie(ctx: CanvasRenderingContext2D, cx: number, cy: number, b: Boss) {
  const rotation = b.accessoryState === "broken" ? -15 * Math.PI / 180 : 0;
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

// Layer 7: 顔 (表情: calm 笑顔 / sweat 水平 / panic 下向き弧)
function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, b: Boss) {
  ctx.save();
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.skin;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  // 口の表情
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (b.faceState === "calm") {
    // 上向き弧 (笑顔)
    ctx.arc(cx, cy + 2, 3, 0.1 * Math.PI, 0.9 * Math.PI);
  } else if (b.faceState === "sweat") {
    // 水平 (無表情)
    ctx.moveTo(cx - 3, cy + 3);
    ctx.lineTo(cx + 3, cy + 3);
  } else {
    // 下向き弧 (焦り)
    ctx.arc(cx, cy + 5, 3, -0.9 * Math.PI, -0.1 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
}

// Layer 8: 髪 (Phase 2: 右2pxズレ / Phase 3: 左右5pxズレ + 上3px跳ね)
function drawHair(ctx: CanvasRenderingContext2D, cx: number, cy: number, b: Boss) {
  ctx.save();
  ctx.fillStyle = CHIP_LEADER_COLORS.phase3.hair;
  if (b.accessoryState === "intact") {
    // 整った半円
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 8, Math.PI, 0);
    ctx.fill();
  } else if (b.accessoryState === "cracked") {
    // 右 2px ズレ
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 2, 8, Math.PI, 0);
    ctx.fill();
  } else {
    // 左右両端 5px ズレ + 上方向 3px 跳ね
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy + 2);
    ctx.quadraticCurveTo(cx - 5, cy - 11, cx, cy - 6);
    ctx.quadraticCurveTo(cx + 5, cy - 11, cx + 13, cy + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Layer 9: サングラス (state.sunglassesY/Rotation/Alpha で吹っ飛びアニメ反映)
function drawSunglasses(ctx: CanvasRenderingContext2D, cx: number, cy: number, b: Boss) {
  const alpha = b.sunglassesAlpha ?? 1;
  if (alpha <= 0) return;
  const yOffset = b.sunglassesY ?? 0;
  const rotation = b.sunglassesRotation ?? 0;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy + yOffset);
  ctx.rotate(rotation);
  ctx.fillStyle = CHIP_LEADER_COLORS.phase1.sunglasses;
  // 左レンズ
  ctx.fillRect(-9, -2, 7, 4);
  // 右レンズ
  ctx.fillRect(2, -2, 7, 4);
  // ブリッジ
  ctx.fillRect(-2, -1, 4, 1);
  ctx.restore();
}

// Layer 10: 汗 (Phase 2: 1 滴右こめかみ / Phase 3: 2 滴両こめかみ)
function drawSweat(ctx: CanvasRenderingContext2D, cx: number, cy: number, b: Boss) {
  const count = b.accessoryState === "cracked" ? 1 : b.accessoryState === "broken" ? 2 : 0;
  if (count === 0) return;
  ctx.save();
  ctx.fillStyle = CHIP_LEADER_COLORS.phase2.sweat;
  const positions: Array<[number, number]> = count === 1 ? [[8, -2]] : [[-8, -2], [8, -2]];
  for (const [dx, dy] of positions) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy + dy - 3);
    ctx.quadraticCurveTo(cx + dx - 2, cy + dy, cx + dx, cy + dy + 2);
    ctx.quadraticCurveTo(cx + dx + 2, cy + dy, cx + dx, cy + dy - 3);
    ctx.fill();
  }
  ctx.restore();
}

// Layer 11: チップ山 (台形積層)
function drawChipPile(ctx: CanvasRenderingContext2D, cx: number, y: number) {
  ctx.save();
  ctx.fillStyle = "#ffd700";
  for (let i = 0; i < 3; i++) {
    const w = 20 - i * 2;
    ctx.fillRect(cx - w / 2, y - i * 2, w, 2);
  }
  ctx.restore();
}

export const __test__ = {
  AURA_RAINBOW,
};
