// v2 Sprint 2: キャラ描画用カラー + ダイアログ + フォント設定
// 藤井 蓮 (eng-05) AD + 黒田 翔太 (eng-06) GD 合意
// 参考: .company/pipelines/workspaces/2026-04-18-bubble-breaker-v2/sprint-2/stage-1-review/art-direction.md

// スタックバー HUD カラー
export const STACK_BAR_COLORS = {
  playerBg: "rgba(0, 0, 0, 0.5)",
  playerFill: "#4ecdc4",
  playerLow: "#ff6b6b",       // プレイヤー HP 低下時（Phase 1 SHORT STACK）
  bossFill: "#ff4444",
  bossLead: "#ffd700",         // ボス優位時に金色
  bbText: "#e8e8e8",
  delta: {
    gain: "#ffd700",   // +5BB 等
    loss: "#ff6b6b",   // -5BB 等
  },
} as const;

// CHIP LEADER 各 Phase のカラー
export const CHIP_LEADER_COLORS = {
  // Phase 1 (余裕、サングラスつけてる)
  phase1: {
    body: "#1a1a2e",
    tuxedo: "#0a0a1f",
    sunglasses: "#1a1a2e",
    bowtie: "#e63946",
    skin: "#f4c28a", // Sprint 3 Track A: 藤井 AD spec 準拠 (#f0d6b7→#f4c28a で健康的な肌色に)
    aura: "#ffd700",
  },
  // Phase 2 (五角、汗)
  phase2: {
    sweat: "#87ceeb",
  },
  // Phase 3 (サングラス吹っ飛び、髪乱れ)
  phase3: {
    hair: "#1a1a2e",
    collarMessy: "#666",
  },
} as const;

// Phase 転換テキスト
export const PHASE_TRANSITION_TEXT = {
  EVEN_STACK: {
    text: "⚡ EVEN STACK!! ⚡",
    color: "#ffd700",
    fontSize: 28,
  },
  CHIP_LEAD_CHANGE: {
    text: "✨ CHIP LEAD CHANGE!! ✨",
    color: "#ff00ff",
    fontSize: 32,
  },
  ALL_IN_CHIP: {
    text: "ALL IN",
    color: "#ff4444",
    fontSize: 48,
  },
  ALL_IN_3BET: {
    text: "ALL IN",
    color: "#ff4444",
    fontSize: 40,
  },
} as const;

// ワンアウター演出テキスト
export const ONE_OUTER_TEXT = {
  text: "リバーでワンアウターを引いてきた！",
  color: "#ff00ff",
  fontSize: 16,
} as const;

// ザコ敵セリフ吹き出し（黒田 Phase 1b 確定・9 種）
export const ENEMY_DIALOG_LINES: Record<string, readonly string[]> = {
  limp:         ["コールだけ"],
  gaba:         ["カカカカ", "ブラフだよ"],
  donk:         ["72o オールイン！", "93s レイズ！"],
  tag:          ["レンジ計算中...", "オーバーベット！"],
  callstation:  ["コール", "コール", "コール"],
  threebetter:  ["3BET!", "4BET!!", "5BET!!!"],
  gto:          ["EV +2.4bb", "頻度 37.5%"],
  bluffcatch:   ["READ...", "BLUFF CATCH！"],
  slowplay:     ["...", "暗号の AA が見える！"],
} as const;

// デフォルトフォント
export const DEFAULT_FONT = "bold 11px monospace";
export const DIALOG_FONT = "bold 10px monospace";
export const PHASE_TEXT_FONT = "bold 32px monospace"; // サイズは各 PHASE_TRANSITION_TEXT の fontSize で上書き

// ─────────────────────────────────────────────────────────────────
// Sprint 3 Track A Phase 2: Stage 1-3 ボスカラーセット (藤井 eng-05 AD)
// Stage 1: DONK BET KING (赤系 / 衝動的)
// Stage 2: 3-BET MONSTER (黒 + 赤 / 攻撃的)
// Stage 3: SLOW PLAYER GOD (深緑 + 金 / 神秘)
// Stage 4: CHIP_LEADER_COLORS (既存)
// ─────────────────────────────────────────────────────────────────
export const STAGE_BOSS_COLORS = {
  1: {
    body:   "#f5f5f5",   // 白Tシャツ
    accent: "#e63946",   // 赤ロゴ / ラベル文字
    skin:   "#f4c28a",   // 肌色 (CHIP_LEADER_COLORS.phase1.skin と統一)
    hair:   "#2a2a2a",   // 刈り上げ黒髪
    aura:   "#e63946",   // 衝動の赤オーラ
    chip:   "#e63946",   // 赤チップ
  },
  2: {
    body:   "#1a1a2e",   // 黒ジャケット (CHIP_LEADER_COLORS.phase1.body と統一)
    accent: "#e63946",   // 赤サングラス / ラベル
    skin:   "#f4c28a",   // 肌色
    hair:   "#1a1a1a",   // ツーブロック黒
    aura:   "#cc0000",   // 深赤オーラ (怒気)
  },
  3: {
    body:   "#1b4332",   // 深緑の衣
    accent: "#c9a84c",   // 金の衣縁 / ラベル
    skin:   "#e8c49a",   // 落ち着いた肌色
    hair:   "#e8e8e8",   // 白髪
    aura:   "#2d6a4f",   // 静謐な深緑オーラ
    sash:   "#c9a84c",   // 袈裟の紐 (金)
  },
} as const;

export type StageBossColorKey = keyof typeof STAGE_BOSS_COLORS;

// ─────────────────────────────────────────────────────────────────
// Sprint 4: Stage 1-3 ボス SVG アセット (藤井 eng-05 AD draft 準拠)
// viewBox 統一 120×140。drawImage で boss.w×boss.h (120×140) に描画
// 体型比は SVG 内の shape width で表現 (Stage 1: 基準幅 80 / Stage 2: 広幅 110 / Stage 3: 細身 40)
// Phase 別 3 state (intact/cracked/broken): intact をベースに色/opacity/要素差分
// ─────────────────────────────────────────────────────────────────
export type BossPhase = "intact" | "cracked" | "broken";

// Stage 1 DONK BET KING (Jester、下膨れ洋梨、酔い弧、ビールジョッキ)
const DONK_SVG_COMMON = `
<defs>
  <radialGradient id="blush-donk" cx="50%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#ff6b6b"/>
    <stop offset="100%" stop-color="#f4c28a"/>
  </radialGradient>
  <linearGradient id="shirt-donk" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff8a80"/>
    <stop offset="100%" stop-color="#ff6b6b"/>
  </linearGradient>
</defs>`;
const DONK_SVG_BODY = `
<ellipse cx="60" cy="125" rx="52" ry="10" fill="rgba(255,107,107,0.15)"/>
<path d="M 38 72 C 20 80 14 105 30 118 L 90 118 C 106 105 100 80 82 72 Z" fill="url(#shirt-donk)"/>
<line x1="30" y1="84" x2="90" y2="84" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
<line x1="26" y1="96" x2="94" y2="96" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
<line x1="24" y1="108" x2="96" y2="108" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
<rect x="28" y="112" width="64" height="4" rx="1" fill="#8b4513"/>
<rect x="40" y="118" width="16" height="16" rx="2" fill="#2c3e50"/>
<rect x="64" y="118" width="16" height="16" rx="2" fill="#2c3e50"/>
<circle cx="60" cy="50" r="28" fill="url(#blush-donk)"/>
<path d="M 44 32 Q 60 22 76 32" stroke="#c89270" stroke-width="2" fill="none" opacity="0.6"/>
<circle cx="52" cy="47" r="2" fill="#1a1a1a"/>
<circle cx="68" cy="47" r="2" fill="#1a1a1a"/>
<circle cx="60" cy="54" r="4" fill="#e63946" opacity="0.8"/>
<rect x="88" y="75" width="18" height="24" rx="3" fill="#f5deb3" stroke="#c8a96e" stroke-width="1"/>
<ellipse cx="97" cy="73" rx="9" ry="5" fill="white" opacity="0.9"/>
<path d="M 106 80 Q 114 82 106 90" stroke="#c8a96e" stroke-width="2" fill="none"/>`;

// Stage 2 3-BET MONSTER (Warrior、3 頭、黒スーツ、赤サングラス、拳突き上げ)
const THREEBET_SVG_COMMON = `
<defs>
  <linearGradient id="suit-3bet" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2a2a4e"/>
    <stop offset="50%" stop-color="#1a1a2e"/>
    <stop offset="100%" stop-color="#0a0a1e"/>
  </linearGradient>
  <radialGradient id="head-3bet" cx="50%" cy="40%" r="55%">
    <stop offset="0%" stop-color="#5a5a6e"/>
    <stop offset="100%" stop-color="#2a2a3e"/>
  </radialGradient>
</defs>`;
const THREEBET_SVG_BODY = `
<ellipse cx="60" cy="130" rx="55" ry="5" fill="rgba(26,26,46,0.4)"/>
<path d="M 8 76 L 18 60 L 102 60 L 112 76 L 108 128 L 12 128 Z" fill="url(#suit-3bet)"/>
<rect x="54" y="60" width="12" height="40" fill="rgba(255,255,255,0.08)"/>
<polygon points="54,60 60,80 66,60" fill="#e74c3c"/>
<g><circle cx="30" cy="38" r="18" fill="url(#head-3bet)"/><path d="M 20 22 L 30 14 L 40 22" fill="#1a1a2e"/></g>
<g><circle cx="60" cy="32" r="20" fill="url(#head-3bet)"/><path d="M 48 14 L 60 6 L 72 14" fill="#1a1a2e"/></g>
<g><circle cx="90" cy="38" r="18" fill="url(#head-3bet)"/><path d="M 80 22 L 90 14 L 100 22" fill="#1a1a2e"/></g>
<rect x="22" y="32" width="16" height="4" fill="#e74c3c" opacity="0.9"/>
<rect x="50" y="26" width="20" height="5" fill="#e74c3c" opacity="0.9"/>
<rect x="82" y="32" width="16" height="4" fill="#e74c3c" opacity="0.9"/>
<circle cx="26" cy="34" r="2" fill="#1a1a1a"/><circle cx="34" cy="34" r="2" fill="#1a1a1a"/>
<circle cx="55" cy="28" r="2.5" fill="#1a1a1a"/><circle cx="65" cy="28" r="2.5" fill="#1a1a1a"/>
<circle cx="86" cy="34" r="2" fill="#1a1a1a"/><circle cx="94" cy="34" r="2" fill="#1a1a1a"/>`;

// Stage 3 SLOW PLAYER GOD (Sage、縦長、深緑衣、白髪、伏せカード、瞑想)
const SLOW_SVG_COMMON = `
<defs>
  <radialGradient id="aura-slow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="rgba(45,106,79,0.5)"/>
    <stop offset="100%" stop-color="rgba(45,106,79,0)"/>
  </radialGradient>
  <linearGradient id="robe-slow" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2a5c45"/>
    <stop offset="100%" stop-color="#1b4332"/>
  </linearGradient>
</defs>`;
const SLOW_SVG_BODY = `
<ellipse cx="60" cy="70" rx="50" ry="65" fill="url(#aura-slow)"/>
<path d="M 48 60 L 72 60 L 76 130 L 44 130 Z" fill="url(#robe-slow)"/>
<rect x="48" y="95" width="24" height="3" fill="#c9a84c"/>
<ellipse cx="60" cy="42" rx="15" ry="20" fill="#e8c49a"/>
<path d="M 46 30 Q 60 16 74 30 Q 78 48 74 58 L 46 58 Q 42 48 46 30" fill="#e8e8e8"/>
<path d="M 50 42 Q 56 44 54 46" stroke="#5a4a3a" stroke-width="1.5" fill="none"/>
<path d="M 64 42 Q 70 44 68 46" stroke="#5a4a3a" stroke-width="1.5" fill="none"/>
<path d="M 54 56 Q 60 58 66 56" stroke="#5a4a3a" stroke-width="1.2" fill="none"/>
<rect x="40" y="80" width="14" height="20" rx="1.5" fill="#1a2540" stroke="#8090b0" stroke-width="0.8"/>
<rect x="42" y="82" width="10" height="16" rx="1" fill="none" stroke="rgba(128,144,176,0.4)" stroke-width="0.5"/>
<rect x="66" y="80" width="14" height="20" rx="1.5" fill="#1a2540" stroke="#8090b0" stroke-width="0.8"/>
<rect x="68" y="82" width="10" height="16" rx="1" fill="none" stroke="rgba(128,144,176,0.4)" stroke-width="0.5"/>`;

function wrapSvg(defs: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140">${defs}${body}</svg>`;
}

export const STAGE_BOSS_SVG: Record<number, Record<BossPhase, string>> = {
  1: {
    intact: wrapSvg(DONK_SVG_COMMON, DONK_SVG_BODY + `
<path d="M 50 62 Q 60 70 70 62" stroke="#d63031" stroke-width="2" fill="none" stroke-linecap="round"/>`),
    cracked: wrapSvg(DONK_SVG_COMMON, DONK_SVG_BODY + `
<path d="M 50 63 Q 60 68 70 63" stroke="#d63031" stroke-width="2" fill="none" stroke-linecap="round"/>
<ellipse cx="55" cy="35" rx="3" ry="2" fill="rgba(135,206,235,0.8)"/>
<ellipse cx="65" cy="35" rx="3" ry="2" fill="rgba(135,206,235,0.8)"/>`),
    broken: wrapSvg(DONK_SVG_COMMON, DONK_SVG_BODY + `
<path d="M 50 68 Q 60 60 70 68" stroke="#8b0000" stroke-width="3" fill="none" stroke-linecap="round"/>
<ellipse cx="50" cy="34" rx="3" ry="4" fill="rgba(135,206,235,0.95)"/>
<ellipse cx="70" cy="34" rx="3" ry="4" fill="rgba(135,206,235,0.95)"/>
<path d="M 45 22 L 48 18 L 52 21" stroke="#ff0000" stroke-width="2" fill="none"/>`),
  },
  2: {
    intact: wrapSvg(THREEBET_SVG_COMMON, THREEBET_SVG_BODY + `
<path d="M 54 42 Q 60 46 66 42" stroke="#1a1a1a" stroke-width="1.5" fill="none"/>`),
    cracked: wrapSvg(THREEBET_SVG_COMMON, THREEBET_SVG_BODY + `
<path d="M 52 43 Q 60 48 68 43" stroke="#1a1a1a" stroke-width="2" fill="none"/>
<polygon points="55,44 58,48 61,44 64,48 67,44" stroke="#fff" stroke-width="1" fill="none"/>`),
    broken: wrapSvg(THREEBET_SVG_COMMON, THREEBET_SVG_BODY + `
<path d="M 50 46 Q 60 52 70 46" stroke="#8b0000" stroke-width="2.5" fill="none"/>
<polygon points="54,46 58,52 62,46 66,52 70,46" stroke="#fff" stroke-width="1.2" fill="#fff"/>
<path d="M 45 25 L 48 22" stroke="#ff0000" stroke-width="2"/><path d="M 72 25 L 75 22" stroke="#ff0000" stroke-width="2"/>`),
  },
  3: {
    intact: wrapSvg(SLOW_SVG_COMMON, SLOW_SVG_BODY),
    cracked: wrapSvg(SLOW_SVG_COMMON, SLOW_SVG_BODY + `
<circle cx="54" cy="42" r="3" fill="#c8d8e0" stroke="#8090a0" stroke-width="0.5"/>
<circle cx="54" cy="43" r="1.5" fill="#1a2030"/>`),
    broken: wrapSvg(SLOW_SVG_COMMON, SLOW_SVG_BODY + `
<circle cx="54" cy="42" r="4" fill="#3a1020" stroke="#e74c3c" stroke-width="1"/>
<circle cx="66" cy="42" r="4" fill="#3a1020" stroke="#e74c3c" stroke-width="1"/>
<circle cx="55" cy="43" r="2" fill="#ff2040"/>
<circle cx="67" cy="43" r="2" fill="#ff2040"/>
<path d="M 50 56 Q 60 62 70 56" stroke="#c9a84c" stroke-width="1.5" fill="none"/>`),
  },
};

// Boss phase 判定 (HP ratio ベース)
export function getBossPhase(hp: number, maxHp: number): BossPhase {
  const r = hp / maxHp;
  if (r > 0.6) return "intact";
  if (r > 0.3) return "cracked";
  return "broken";
}

// Sprint 4 Research synthesis: チップパーティクル色のボス別拡張 (res-07 推奨)
export const BOSS_CHIP_COLORS: Record<number, { primary: string; secondary: string }> = {
  1: { primary: "#f5f5f5", secondary: "#e74c3c" },
  2: { primary: "#1a1a1a", secondary: "#e74c3c" },
  3: { primary: "#8e44ad", secondary: "#95a5a6" },
  4: { primary: "#ffd700", secondary: "#ffd700" },
};
