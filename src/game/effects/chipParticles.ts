// v2 Sprint 2 Commit 2: チップパーティクル
// ボスヒット時に攻撃位置 → プレイヤー HUD に金チップが吸い込まれる
// 被弾時は逆方向 (player → boss HUD)
// 上限: 通常 40 / Phase 転換時 80 / 低端末 20-40
// art-direction §5 / synthesis §5 Commit 2 準拠

import type { ChipParticle, ChipParticleKind, GameState } from "../state/GameState";
import { FX_LIMITS, isLowEndDevice } from "./fxConfig";
import { CANVAS_W } from "../state/GameState";

const LERP_FACTOR = 0.08;
const GRAVITY_VY = 0.1;
const PARTICLE_LIFE_FRAMES = 60;
const ARRIVAL_RADIUS = 12;

// HUD 位置 (Renderer drawStackBar と整合: yPlayer=60, yBoss=74, x range 70..(CANVAS_W-20))
const PLAYER_HUD_TARGET_X = 70 + (CANVAS_W - 90) * 0.2; // YOU バーの先端付近
const PLAYER_HUD_TARGET_Y = 65;
const BOSS_HUD_TARGET_X = 70 + (CANVAS_W - 90) * 0.8;
const BOSS_HUD_TARGET_Y = 79;

function getMaxParticles(transitionActive: boolean): number {
  const lowEnd = isLowEndDevice();
  if (lowEnd) {
    return transitionActive ? FX_LIMITS.chipParticlesLowEndTransition : FX_LIMITS.chipParticlesLowEndNormal;
  }
  return transitionActive ? FX_LIMITS.chipParticlesTransitionMax : FX_LIMITS.chipParticlesNormalMax;
}

/**
 * 1 ヒットで複数粒子をまとめて spawn する
 * fromX/Y: spawn 起点（攻撃ヒット位置）
 * kind: "to-player" (ボスヒット時) or "to-boss" (被弾時)
 * count: 推奨 3-5
 */
export function spawnChipBurst(
  g: GameState,
  fromX: number,
  fromY: number,
  kind: ChipParticleKind,
  count: number,
  color: string = "#ffd700",
) {
  if (!g.chipParticles) g.chipParticles = [];
  const transitionActive = g.phaseTransition !== undefined;
  const max = getMaxParticles(transitionActive);
  const targetX = kind === "to-player" ? PLAYER_HUD_TARGET_X : BOSS_HUD_TARGET_X;
  const targetY = kind === "to-player" ? PLAYER_HUD_TARGET_Y : BOSS_HUD_TARGET_Y;

  for (let i = 0; i < count; i++) {
    if (g.chipParticles.length >= max) {
      // 上限到達時は最古のものから drop
      g.chipParticles.shift();
    }
    const jitterX = (Math.random() - 0.5) * 12;
    const jitterY = (Math.random() - 0.5) * 8;
    g.chipParticles.push({
      x: fromX + jitterX,
      y: fromY + jitterY,
      targetX,
      targetY,
      vy: -1.5 + Math.random() * 0.8, // 上向き初速 (放物線初期)
      life: PARTICLE_LIFE_FRAMES,
      maxLife: PARTICLE_LIFE_FRAMES,
      color,
      kind,
    });
  }
}

/**
 * 毎フレーム呼び出し: ベジェ補間 + 重力 + 寿命管理
 */
export function updateChipParticles(g: GameState) {
  if (!g.chipParticles || g.chipParticles.length === 0) return;
  g.chipParticles = g.chipParticles.filter((p) => {
    p.life--;
    if (p.life <= 0) return false;
    // ターゲットへの線形補間 (ベジェ風: 序盤は重力で外れて、後半でターゲットに引き寄せ)
    p.y += p.vy;
    p.vy += GRAVITY_VY;
    p.x += (p.targetX - p.x) * LERP_FACTOR;
    p.y += (p.targetY - p.y) * LERP_FACTOR;
    // 到達判定
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    if (Math.sqrt(dx * dx + dy * dy) < ARRIVAL_RADIUS) return false;
    return true;
  });
}

export const __test__ = {
  getMaxParticles,
  PLAYER_HUD_TARGET_X,
  PLAYER_HUD_TARGET_Y,
  BOSS_HUD_TARGET_X,
  BOSS_HUD_TARGET_Y,
};
