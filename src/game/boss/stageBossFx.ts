// v2 Sprint 3 Track A Phase 2: Stage 1-3 ボス個性化描画
// 藤井 蓮 (eng-05) Art Direction
// chipLeaderFx.ts (Stage 4) と同スタイル: レガシー 50×50 bbox 前提の座標系 + ctx.scale で拡大適応
//
// Stage 1: DONK BET KING  — 自信過剰な初心者、チップを荒々しく持つ赤系
// Stage 2: 3-BET MONSTER  — サングラス攻撃型、拳突き上げポーズ、黒ジャケット+赤サングラス
// Stage 3: SLOW PLAYER GOD — 瞑想型熟練者、目閉じ沈思、深緑+袈裟+伏せカード2枚
//
// hp/maxHp 比でアクセサリ状態を導出:
//   hp > 60%: "intact"   (通常)
//   hp 30-60%: "cracked" (ダメージ)
//   hp < 30%: "broken"   (瀕死)

import type { Boss } from "../state/GameState";
import { STAGE_BOSS_COLORS } from "../characters/constants";

const LEGACY_BBOX_W = 50; // Sprint 2 時代のレガシー bbox 幅 (chipLeaderFx.ts と同じ基準)

/**
 * Stage 1-3 のボスを描画する。
 * Renderer.ts の boss 描画ブロックで stageNum 1/2/3 の場合に呼び出す。
 * stageNum 4 は drawChipLeader() が担当するため対象外。
 */
export function drawStageBoss(
  ctx: CanvasRenderingContext2D,
  b: Boss,
  stageNum: number,
  frameCount: number,
): void {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const scale = b.w / LEGACY_BBOX_W;
  const hpRatio = b.hp / b.maxHp;
  const accessory = hpRatio > 0.6 ? "intact" : hpRatio > 0.3 ? "cracked" : "broken";

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  if (stageNum === 1) {
    drawDonkBetKing(ctx, cx, cy, b, accessory, frameCount);
  } else if (stageNum === 2) {
    drawThreeBetMonster(ctx, cx, cy, b, accessory, frameCount);
  } else if (stageNum === 3) {
    drawSlowPlayerGod(ctx, cx, cy, b, accessory, frameCount);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────
// Stage 1: DONK BET KING
// ─────────────────────────────────────────────
// Layer 1: 赤オーラ (自信過剰の衝動的エネルギー)
// Layer 2: 頭上ラベル "DONK BET!"
// Layer 3: 白Tシャツ + 体
// Layer 4: 顔 (ゆるい笑顔 → intact / 不満顔 → cracked / 怒り → broken)
// Layer 5: 短髪 + 汗
// Layer 6: 右手チップ (intact: 高く掲げる / broken: 落下)
// Layer 7: 左手グー (自信アピール)

function drawDonkBetKing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
  accessory: "intact" | "cracked" | "broken",
  frame: number,
): void {
  const c = STAGE_BOSS_COLORS[1];

  // Layer 1: 赤オーラ
  ctx.save();
  const pulseFactor = 1 + 0.08 * Math.sin(frame * 0.12);
  const auraR = (accessory === "broken" ? 28 : 24) * pulseFactor;
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, auraR);
  grad.addColorStop(0, c.aura + "bb");
  grad.addColorStop(1, c.aura + "00");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Layer 2: 頭上ラベル
  ctx.save();
  const labelY = cy - 25 - 14;
  const jitter = accessory === "broken" ? (frame % 2 === 0 ? 1 : -1) : 0;
  ctx.fillStyle = c.accent;
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("DONK BET!", cx + jitter, labelY);
  ctx.restore();

  // Layer 3: 体 (白Tシャツ + 首)
  ctx.save();
  // 胴体
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 4);
  ctx.lineTo(cx + 10, cy + 4);
  ctx.lineTo(cx + 11, cy + 22);
  ctx.lineTo(cx - 11, cy + 22);
  ctx.closePath();
  ctx.fill();
  // 首
  ctx.fillStyle = c.skin;
  ctx.fillRect(cx - 3, cy - 1, 6, 7);
  // Tシャツロゴ風 (略字)
  ctx.fillStyle = c.accent;
  ctx.font = "bold 5px monospace";
  ctx.textAlign = "center";
  ctx.fillText("DB", cx, cy + 16);
  ctx.restore();

  // Layer 4: 顔
  ctx.save();
  const faceY = cy - 8;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(cx, faceY, 9, 0, Math.PI * 2);
  ctx.fill();
  // 口 (笑顔 → 不満 → 怒り)
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (accessory === "intact") {
    // 上向き弧 (にやけ笑い)
    ctx.arc(cx, faceY + 3, 4, 0.1 * Math.PI, 0.9 * Math.PI);
  } else if (accessory === "cracked") {
    // 直線 (不満)
    ctx.moveTo(cx - 4, faceY + 4);
    ctx.lineTo(cx + 4, faceY + 4);
  } else {
    // 下向き弧 (怒り)
    ctx.arc(cx, faceY + 6, 4, -0.9 * Math.PI, -0.1 * Math.PI);
  }
  ctx.stroke();
  // 眉 (怒り eyebrow: V字)
  if (accessory !== "intact") {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 7, faceY - 4);
    ctx.lineTo(cx - 3, faceY - 2);
    ctx.moveTo(cx + 7, faceY - 4);
    ctx.lineTo(cx + 3, faceY - 2);
    ctx.stroke();
  }
  ctx.restore();

  // Layer 5: 短髪 + 汗
  ctx.save();
  ctx.fillStyle = c.hair;
  // 短髪 (頭頂部を覆う平たい矩形+弧)
  if (accessory === "broken") {
    // 乱れ髪
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 15);
    ctx.quadraticCurveTo(cx - 6, cy - 22, cx, cy - 18);
    ctx.quadraticCurveTo(cx + 6, cy - 22, cx + 12, cy - 15);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 9, Math.PI, 0);
    ctx.fill();
    // 刈り上げ側面
    ctx.fillRect(cx - 9, cy - 13, 4, 8);
    ctx.fillRect(cx + 5, cy - 13, 4, 8);
  }
  // 汗 (cracked 以降)
  if (accessory !== "intact") {
    ctx.fillStyle = "#87ceeb";
    const sweatPositions: Array<[number, number]> = accessory === "broken"
      ? [[cx - 10, cy - 8], [cx + 10, cy - 8]]
      : [[cx + 9, cy - 8]];
    for (const [sx, sy] of sweatPositions) {
      ctx.beginPath();
      ctx.moveTo(sx, sy - 3);
      ctx.quadraticCurveTo(sx - 2, sy, sx, sy + 2);
      ctx.quadraticCurveTo(sx + 2, sy, sx, sy - 3);
      ctx.fill();
    }
  }
  ctx.restore();

  // Layer 6: 右手チップ (intact: 高く掲げる / broken: 落下)
  ctx.save();
  const chipDropY = accessory === "broken" ? (frame % 40) * 0.5 : 0;
  const chipRaiseY = accessory === "intact" ? -6 : 0;
  const chipX = cx + 16;
  const chipY = cy + 8 + chipRaiseY + chipDropY;
  const chipAlpha = accessory === "broken" ? Math.max(0, 1 - chipDropY / 18) : 1;
  ctx.globalAlpha = chipAlpha;
  // チップ本体
  ctx.fillStyle = c.chip;
  ctx.beginPath();
  ctx.arc(chipX, chipY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 4px monospace";
  ctx.textAlign = "center";
  ctx.fillText("$", chipX, chipY + 1.5);
  // 腕 (右)
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy + 10);
  ctx.lineTo(chipX - 2, chipY + 2);
  ctx.stroke();
  ctx.restore();

  // Layer 7: 左手 (グー・アピール)
  ctx.save();
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(cx - 17, cy + 10, 4, 0, Math.PI * 2);
  ctx.fill();
  // 腕 (左)
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 10);
  ctx.lineTo(cx - 14, cy + 12);
  ctx.stroke();
  ctx.restore();
}

// ─────────────────────────────────────────────
// Stage 2: 3-BET MONSTER
// ─────────────────────────────────────────────
// Layer 1: 黒＋赤オーラ (攻撃的エネルギー)
// Layer 2: 頭上ラベル "3-BET!!" (point 増加でカウント)
// Layer 3: 黒ジャケット + ロゴTシャツ
// Layer 4: 顔 (intact: 不敵な笑み / cracked: 牙をむく / broken: 激怒)
// Layer 5: 黒髪 (intact: ツーブロック / broken: 逆立ち)
// Layer 6: 赤サングラス (intact: 位置正常 / cracked: ずれ / broken: 吹っ飛び)
// Layer 7: 拳突き上げポーズ

function drawThreeBetMonster(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
  accessory: "intact" | "cracked" | "broken",
  frame: number,
): void {
  const c = STAGE_BOSS_COLORS[2];

  // Layer 1: 攻撃オーラ
  ctx.save();
  const auraShift = Math.sin(frame * 0.2) * 3;
  const grad = ctx.createRadialGradient(cx, cy + auraShift, 5, cx, cy, 30);
  grad.addColorStop(0, c.aura + "99");
  grad.addColorStop(0.6, c.accent + "44");
  grad.addColorStop(1, c.aura + "00");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Layer 2: ラベル
  ctx.save();
  const betCount = accessory === "intact" ? "3-BET!!" : accessory === "cracked" ? "4-BET!!" : "5-BET!!!";
  ctx.fillStyle = c.accent;
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  const labelJitter = accessory === "broken" ? (frame % 3 === 0 ? 2 : frame % 3 === 1 ? -2 : 0) : 0;
  ctx.fillText(betCount, cx + labelJitter, cy - 25 - 14);
  ctx.restore();

  // Layer 3: 黒ジャケット + シャツ
  ctx.save();
  // ジャケット外形
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(cx - 13, cy + 2);
  ctx.lineTo(cx + 13, cy + 2);
  ctx.lineTo(cx + 14, cy + 22);
  ctx.lineTo(cx - 14, cy + 22);
  ctx.closePath();
  ctx.fill();
  // ラペル (白)
  ctx.fillStyle = "#e8e8e8";
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 2);
  ctx.lineTo(cx, cy + 10);
  ctx.lineTo(cx + 4, cy + 2);
  ctx.closePath();
  ctx.fill();
  // ロゴ文字 (小)
  ctx.fillStyle = c.accent;
  ctx.font = "bold 4px monospace";
  ctx.textAlign = "center";
  ctx.fillText("3BM", cx, cy + 18);
  // 首
  ctx.fillStyle = c.skin;
  ctx.fillRect(cx - 3, cy - 1, 6, 6);
  ctx.restore();

  // Layer 4: 顔
  ctx.save();
  const faceY = cy - 8;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(cx, faceY, 9, 0, Math.PI * 2);
  ctx.fill();
  // 口
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (accessory === "intact") {
    // 片側上がりの不敵な笑み (非対称)
    ctx.moveTo(cx - 3, faceY + 4);
    ctx.quadraticCurveTo(cx + 2, faceY + 3, cx + 5, faceY + 2);
    ctx.stroke();
  } else if (accessory === "cracked") {
    // 牙 (下に凸のジグザグ)
    ctx.moveTo(cx - 5, faceY + 3);
    ctx.lineTo(cx - 2, faceY + 5);
    ctx.lineTo(cx, faceY + 3);
    ctx.lineTo(cx + 2, faceY + 5);
    ctx.lineTo(cx + 5, faceY + 3);
    ctx.stroke();
  } else {
    // 激怒 (大きく開けた口)
    ctx.arc(cx, faceY + 4, 5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    // 口の内側 (赤)
    ctx.fillStyle = "#cc0000";
    ctx.beginPath();
    ctx.arc(cx, faceY + 4, 4, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();
  }
  // V字眉 (常時)
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 8, faceY - 5);
  ctx.lineTo(cx - 3, faceY - 3);
  ctx.moveTo(cx + 8, faceY - 5);
  ctx.lineTo(cx + 3, faceY - 3);
  ctx.stroke();
  ctx.restore();

  // Layer 5: 黒髪 (ツーブロック → 逆立ち)
  ctx.save();
  ctx.fillStyle = c.hair;
  if (accessory === "broken") {
    // 逆立ち: 上向きスパイク
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 5 - 2, cy - 16);
      ctx.lineTo(cx + i * 5, cy - 24 - Math.abs(i) * 2);
      ctx.lineTo(cx + i * 5 + 2, cy - 16);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // ツーブロック (サイド刈り上げ + トップだけ残す)
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 9, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 9, cy - 13, 18, 4);
    // サイドは刈り上げ (短い線)
    ctx.fillStyle = c.body;
    ctx.fillRect(cx - 9, cy - 9, 2, 4);
    ctx.fillRect(cx + 7, cy - 9, 2, 4);
  }
  ctx.restore();

  // Layer 6: 赤サングラス
  ctx.save();
  const sgOffsetY = accessory === "cracked" ? 3 : 0;
  const sgRotation = accessory === "cracked" ? 0.15 : accessory === "broken" ? 0.5 : 0;
  const sgAlpha = accessory === "broken" ? Math.max(0, 0.6 - (frame % 60) * 0.01) : 1;
  const sgDriftX = accessory === "broken" ? (frame % 60) * 0.3 : 0;
  ctx.globalAlpha = sgAlpha;
  ctx.translate(cx + sgDriftX, cy - 8 + sgOffsetY);
  ctx.rotate(sgRotation);
  ctx.fillStyle = c.accent; // 赤サングラス
  // 左レンズ
  ctx.fillRect(-10, -2, 8, 5);
  // 右レンズ
  ctx.fillRect(2, -2, 8, 5);
  // ブリッジ
  ctx.fillStyle = "#000";
  ctx.fillRect(-2, -1, 4, 2);
  // フレーム縁
  ctx.strokeStyle = "#660000";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-10, -2, 8, 5);
  ctx.strokeRect(2, -2, 8, 5);
  ctx.restore();
  ctx.globalAlpha = 1;

  // Layer 7: 拳突き上げポーズ (右拳)
  ctx.save();
  const fistY = accessory === "intact" ? cy - 5 : cy + 3; // intact: 高く上げる
  // 右腕
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 9, cy + 8);
  ctx.lineTo(cx + 18, fistY + 2);
  ctx.stroke();
  // 右拳
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(cx + 19, fistY, 4, 0, Math.PI * 2);
  ctx.fill();
  // 左腕 (脇)
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy + 8);
  ctx.lineTo(cx - 16, cy + 16);
  ctx.stroke();
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(cx - 17, cy + 17, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────
// Stage 3: SLOW PLAYER GOD
// ─────────────────────────────────────────────
// Layer 1: 深緑のオーラ (神秘的・静謐な放射)
// Layer 2: 頭上ラベル "SLOW PLAY..." (省略記号付き・薄暗い)
// Layer 3: 袈裟風の装束 (深緑)
// Layer 4: 顔 (目を閉じ沈思 → intact: 静穏 / cracked: 微かに眉が動く / broken: 片目を開く)
// Layer 5: 白髪 (禅マスター感)
// Layer 6: 両手で伏せカード2枚 (intact: 胸前保持 / broken: 少し浮かせる)
// Layer 7: 輪廻の光点 (小粒 particle 演出)

function drawSlowPlayerGod(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  b: Boss,
  accessory: "intact" | "cracked" | "broken",
  frame: number,
): void {
  const c = STAGE_BOSS_COLORS[3];

  // Layer 1: 神秘的な深緑オーラ (ゆっくり拡縮)
  ctx.save();
  const breathe = 1 + 0.05 * Math.sin(frame * 0.05);
  const auraR = 28 * breathe;
  const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, auraR);
  grad.addColorStop(0, c.aura + "88");
  grad.addColorStop(0.5, c.aura + "33");
  grad.addColorStop(1, c.aura + "00");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Layer 2: 頭上ラベル (薄く・謎めいた)
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = c.accent;
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  const dots = ".".repeat(((Math.floor(frame / 30)) % 3) + 1);
  ctx.fillText(`SLOW PLAY${dots}`, cx, cy - 25 - 14);
  ctx.restore();

  // Layer 3: 袈裟風の装束
  ctx.save();
  // メイン衣 (深緑)
  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 0);
  ctx.lineTo(cx + 14, cy + 0);
  ctx.lineTo(cx + 16, cy + 24);
  ctx.lineTo(cx - 16, cy + 24);
  ctx.closePath();
  ctx.fill();
  // 衣の折り返し縁 (アクセント色)
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 0);
  ctx.lineTo(cx, cy + 10);
  ctx.lineTo(cx + 5, cy + 0);
  ctx.stroke();
  // 袈裟の斜め紐 (右肩から左腰)
  ctx.strokeStyle = c.sash;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 2);
  ctx.lineTo(cx - 12, cy + 20);
  ctx.stroke();
  // 首
  ctx.fillStyle = c.skin;
  ctx.fillRect(cx - 3, cy - 2, 6, 7);
  ctx.restore();

  // Layer 4: 顔 (目閉じ瞑想)
  ctx.save();
  const faceY = cy - 9;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(cx, faceY, 9, 0, Math.PI * 2);
  ctx.fill();
  // 閉じた目
  ctx.strokeStyle = "#2d4a2d";
  ctx.lineWidth = 1.2;
  if (accessory === "broken") {
    // 右目だけ開く (凄みを出す)
    ctx.beginPath();
    // 左目: 閉じた弧
    ctx.arc(cx - 3.5, faceY - 1, 2.5, Math.PI, 0);
    ctx.stroke();
    // 右目: 開いた目
    ctx.fillStyle = "#1a3a1a";
    ctx.beginPath();
    ctx.arc(cx + 3.5, faceY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx + 4.2, faceY - 1.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 両目閉じ
    ctx.beginPath();
    ctx.arc(cx - 3.5, faceY - 1, 2.5, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 3.5, faceY - 1, 2.5, Math.PI, 0);
    ctx.stroke();
    // cracked: 眉が微かに動く
    if (accessory === "cracked") {
      const brow = 0.5 * Math.sin(frame * 0.1);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 6, faceY - 5 - brow);
      ctx.lineTo(cx - 1, faceY - 4);
      ctx.moveTo(cx + 6, faceY - 5 - brow);
      ctx.lineTo(cx + 1, faceY - 4);
      ctx.stroke();
    }
  }
  // 口 (一文字に閉じた禅の表情)
  ctx.strokeStyle = "#2d4a2d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 3, faceY + 4);
  ctx.lineTo(cx + 3, faceY + 4);
  ctx.stroke();
  ctx.restore();

  // Layer 5: 白髪 (禅マスター感)
  ctx.save();
  ctx.fillStyle = c.hair;
  // 頭頂 + 左右に流れる白髪
  ctx.beginPath();
  ctx.arc(cx, cy - 12, 9, Math.PI, 0);
  ctx.fill();
  // 左に流れる長い髪
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy - 14);
  ctx.quadraticCurveTo(cx - 18, cy - 5, cx - 16, cy + 5);
  ctx.quadraticCurveTo(cx - 14, cy + 12, cx - 12, cy + 14);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = c.hair;
  ctx.stroke();
  // 右に流れる髪 (短め)
  ctx.beginPath();
  ctx.moveTo(cx + 9, cy - 14);
  ctx.quadraticCurveTo(cx + 16, cy - 8, cx + 14, cy + 4);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Layer 6: 伏せカード 2 枚 (両手で保持)
  ctx.save();
  const cardFloat = accessory === "broken" ? 4 * Math.sin(frame * 0.08) : 0;
  const cardBaseY = cy + 13 - cardFloat;
  // 左カード
  ctx.save();
  ctx.translate(cx - 6, cardBaseY);
  ctx.rotate(-0.12);
  ctx.fillStyle = "#1a2e1a"; // カード裏 (暗い緑)
  ctx.fillRect(-5, -7, 10, 14);
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-5, -7, 10, 14);
  // カード裏模様 (小さい菱形)
  ctx.strokeStyle = c.sash;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -5); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.lineTo(-3, 0); ctx.closePath();
  ctx.stroke();
  ctx.restore();
  // 右カード
  ctx.save();
  ctx.translate(cx + 6, cardBaseY);
  ctx.rotate(0.12);
  ctx.fillStyle = "#1a2e1a";
  ctx.fillRect(-5, -7, 10, 14);
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-5, -7, 10, 14);
  ctx.strokeStyle = c.sash;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -5); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.lineTo(-3, 0); ctx.closePath();
  ctx.stroke();
  ctx.restore();
  // 手 (カードの下から見える)
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(cx - 8, cardBaseY + 7, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 8, cardBaseY + 7, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Layer 7: 輪廻の光点 (小粒が螺旋軌道)
  ctx.save();
  const dotCount = 6;
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 + frame * 0.03;
    const r = 24 + 3 * Math.sin(frame * 0.05 + i);
    const dotX = cx + Math.cos(angle) * r;
    const dotY = cy + Math.sin(angle) * r * 0.5; // 楕円
    const dotAlpha = 0.4 + 0.3 * Math.sin(frame * 0.08 + i * 1.2);
    ctx.globalAlpha = dotAlpha;
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
