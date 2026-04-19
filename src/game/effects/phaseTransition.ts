// v2 Sprint 2 Commit 2: Phase 転換 spawn ヘルパー
// kind 別に duration を fxConfig から解決し GameState に書込
// + 被弾無効タイマー初期化 + 転換時のチップパーティクル一斉発射
// synthesis §5 Commit 2 / art-direction §5 準拠

import type { GameState, PhaseTransitionKind } from "../state/GameState";
import { CANVAS_W, CANVAS_H } from "../state/GameState";
import { readFxConfig, type FxConfig } from "./fxConfig";
import { spawnChipBurst } from "./chipParticles";

const FRAMES_PER_SECOND = 60;
const MS_PER_FRAME = 1000 / FRAMES_PER_SECOND;

function msToFrames(ms: number): number {
  return Math.max(1, Math.round(ms / MS_PER_FRAME));
}

export function getKindDurationMs(kind: PhaseTransitionKind, fx: FxConfig): number {
  switch (kind) {
    case "EVEN_STACK": return fx.evenStackMs;
    case "CHIP_LEAD_CHANGE": return fx.chipLeadChangeMs;
    case "ALL_IN_CHIP": return fx.allInChipMs;
    case "ALL_IN_3BET": return fx.allIn3BetMs;
  }
}

/**
 * Phase 転換を発火
 * - g.phaseTransition を上書き設定 (連続 spawn の場合は新しいものが勝つ)
 * - phaseImmuneMs 分の被弾無効を設定
 * - kind に応じた色のチップパーティクルを画面中央から HUD に吸い込み発射
 */
export function spawnPhaseTransition(
  g: GameState,
  kind: PhaseTransitionKind,
  search: string = typeof window !== "undefined" ? window.location.search : "",
) {
  const fx = readFxConfig(search);
  const durationMs = getKindDurationMs(kind, fx);
  const lifeFrames = msToFrames(durationMs);

  g.phaseTransition = {
    kind,
    life: lifeFrames,
    maxLife: lifeFrames,
  };

  // 被弾無効: phaseImmuneMs 分。攻撃入力は継続 (Game.tsx 側で player.invincible は触らない)
  g.phaseImmuneRemain = msToFrames(fx.phaseImmuneMs);

  // 転換時のチップパーティクル一斉発射 (art-direction §5: 転換時 20 粒)
  // EVEN_STACK / CHIP_LEAD_CHANGE: プレイヤー HUD に吸い込み (player 優位の象徴)
  // ALL_IN_*: ボス HUD に吸い込み (ボス本気モード)
  const isAllIn = kind === "ALL_IN_CHIP" || kind === "ALL_IN_3BET";
  const targetKind = isAllIn ? "to-boss" : "to-player";
  const color = kind === "CHIP_LEAD_CHANGE" ? "#ff00ff" : "#ffd700";
  spawnChipBurst(g, CANVAS_W / 2, CANVAS_H / 2, targetKind, 20, color);
}

/**
 * 毎フレーム呼出: 被弾無効タイマー減算
 * (phaseTransition.life の進行は BossManager.updatePhaseTransition で別管理)
 */
export function updatePhaseImmunity(g: GameState) {
  if (g.phaseImmuneRemain && g.phaseImmuneRemain > 0) {
    g.phaseImmuneRemain--;
    if (g.phaseImmuneRemain <= 0) g.phaseImmuneRemain = undefined;
  }
}

export function isPhaseImmune(g: GameState): boolean {
  return (g.phaseImmuneRemain ?? 0) > 0;
}

export const __test__ = {
  msToFrames,
  FRAMES_PER_SECOND,
};
