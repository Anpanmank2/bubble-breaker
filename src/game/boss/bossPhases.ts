// v2 Sprint 2: CHIP LEADER 戦の HP → BB 換算 + Phase 判定
// Owner 決定 2026-04-18:
// - 換算式: tanh S字 (k=3.2) + Phase 境界スナップ
// - Phase 境界: HP 60% で Phase 1→2、HP 20% で Phase 2→3
// - ゼロサム: playerStackBB + bossStackBB = 120

import type { BossPhase } from "../state/GameState";

const TOTAL_STACK_BB = 120;
const MIN_STACK_BB = 20;
const STACK_RANGE_BB = 80; // 100 - 20 = 80

const TANH_K = 3.2;
const TANH_NORMALIZER = Math.tanh(1.6); // tanh(k*0.5)

// Phase 境界の HP 比率
const PHASE_1_TO_2_HP = 0.6;
const PHASE_2_TO_3_HP = 0.2;

// スナップ範囲（Phase 境界付近で仕様書の 40/80, 80/40 に強制）
const SNAP_WINDOW = 0.02; // ±2% で境界値にスナップ

/**
 * HP 比率から playerStackBB を算出（tanh S 字）
 * hpRatio = 1.0 → 20BB（絶望）, 0.0 → 100BB（逆転）
 */
export function hpToPlayerStack(hpRatio: number): number {
  const clamped = Math.max(0, Math.min(1, hpRatio));
  // tanh S 字: hpRatio 0.5 を中心に、端で飽和
  const normalized = (0.5 - clamped) * TANH_K;
  const ratio = 0.5 + 0.5 * Math.tanh(normalized) / TANH_NORMALIZER;
  const raw = MIN_STACK_BB + STACK_RANGE_BB * ratio;
  return applyPhaseSnap(raw, clamped);
}

/**
 * Phase 境界付近で仕様書の正準値 (40/80, 80/40) にスナップ
 */
function applyPhaseSnap(rawPlayerStack: number, hpRatio: number): number {
  // Phase 1→2 境界 (HP 60% 付近) → player 40, boss 80
  if (Math.abs(hpRatio - PHASE_1_TO_2_HP) <= SNAP_WINDOW) {
    return 40;
  }
  // Phase 2→3 境界 (HP 20% 付近) → player 80, boss 40
  if (Math.abs(hpRatio - PHASE_2_TO_3_HP) <= SNAP_WINDOW) {
    return 80;
  }
  return Math.round(rawPlayerStack * 10) / 10; // 0.1 BB 丸め
}

/**
 * HP 比率から Phase 判定
 */
export function getChipLeaderPhase(hpRatio: number): BossPhase {
  if (hpRatio > PHASE_1_TO_2_HP) return 1;
  if (hpRatio > PHASE_2_TO_3_HP) return 2;
  return 3;
}

/**
 * ゼロサムで bossStackBB 算出
 */
export function playerStackToBossStack(playerStackBB: number): number {
  return Math.round((TOTAL_STACK_BB - playerStackBB) * 10) / 10;
}

/**
 * Phase 遷移の検出（前回 Phase と現在 Phase を比較）
 * 戻り値: 遷移した kind or null
 */
export function detectPhaseTransition(
  prevPhase: BossPhase | undefined,
  currentPhase: BossPhase,
): "EVEN_STACK" | "CHIP_LEAD_CHANGE" | null {
  if (prevPhase === undefined) return null;
  if (prevPhase === 1 && currentPhase === 2) return "EVEN_STACK";
  if (prevPhase === 2 && currentPhase === 3) return "CHIP_LEAD_CHANGE";
  return null;
}
