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
