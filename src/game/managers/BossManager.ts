import { GameState, CANVAS_H, CANVAS_W } from "../state/GameState";
import {
  hpToPlayerStack,
  getChipLeaderPhase,
  playerStackToBossStack,
  detectPhaseTransition,
} from "../boss/bossPhases";
import { readFxConfig } from "../effects/fxConfig";
import { spawnPhaseTransition } from "../effects/phaseTransition";

const CHIP_LEADER_STAGE = 4;

// v2 Sprint 2 Commit 2: Phase 別 shoot パラメータ (CHIP LEADER 戦のみ)
type ShootParams = {
  shootInterval: number;
  spread: number;
  angleSpread: number;
  bulletSpeedMult: number;
};

function getShootParams(g: GameState, hpRatio: number): ShootParams {
  if (g.stageNum === CHIP_LEADER_STAGE && g.boss?.chipLeaderPhase !== undefined) {
    const phase = g.boss.chipLeaderPhase;
    if (phase === 1) return { shootInterval: 35, spread: 1, angleSpread: 0.0, bulletSpeedMult: 1.0 };
    if (phase === 2) return { shootInterval: 28, spread: 3, angleSpread: 0.18, bulletSpeedMult: 1.0 };
    return { shootInterval: 14, spread: 5, angleSpread: 0.14, bulletSpeedMult: 1.8 };
  }
  // Stage 1-3 既存ロジック（回帰防止のため変更しない）
  const shootInterval = hpRatio < 0.3 ? 15 : hpRatio < 0.6 ? 25 : 35;
  const spread = hpRatio < 0.3 ? 3 : hpRatio < 0.6 ? 2 : 1;
  return { shootInterval, spread, angleSpread: 0.2, bulletSpeedMult: 1.0 };
}

// v2 Sprint 2 Commit 2: bossHpScale URL param で boss HP を倍率調整 (QA verification 用)
function readBossHpScale(): number {
  if (typeof window === "undefined") return 1.0;
  const v = new URLSearchParams(window.location.search).get("bossHpScale");
  if (v === null) return 1.0;
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0 || n > 1) return 1.0;
  return n;
}

export function ensureBoss(g: GameState) {
  if (g.boss) return;
  const isChipLeader = g.stageNum === CHIP_LEADER_STAGE;
  const hpRatio = 1.0;
  const hpScale = readBossHpScale();
  const scaledMaxHp = Math.max(1, Math.round(g.cfg.bossHp * hpScale));
  g.boss = {
    x: CANVAS_W - 80,
    y: CANVAS_H / 2 - 40,
    w: 50, h: 50,
    hp: scaledMaxHp,
    maxHp: scaledMaxHp,
    shootTimer: 0,
    sinOffset: 0,
    phase: 0,
    // v2 Sprint 2: CHIP LEADER 戦のみスタック管理
    stackBB: isChipLeader ? playerStackToBossStack(hpToPlayerStack(hpRatio)) : undefined,
    chipLeaderPhase: isChipLeader ? getChipLeaderPhase(hpRatio) : undefined,
    oneOuterUsed: isChipLeader ? false : undefined,
    faceState: isChipLeader ? "calm" : undefined,
    accessoryState: isChipLeader ? "intact" : undefined,
    sunglassesY: isChipLeader ? 0 : undefined,
    sunglassesRotation: isChipLeader ? 0 : undefined,
    sunglassesAlpha: isChipLeader ? 1 : undefined,
  };
  if (isChipLeader) {
    g.playerStackBB = hpToPlayerStack(hpRatio);
  }
}

export function updateBoss(g: GameState) {
  if (!g.boss) return;
  const b = g.boss;
  b.sinOffset += 0.02;
  b.y = CANVAS_H / 2 - 40 + Math.sin(b.sinOffset) * 120;
  b.shootTimer++;

  const hpRatio = b.hp / b.maxHp;
  const params = getShootParams(g, hpRatio);

  if (b.shootTimer >= params.shootInterval) {
    b.shootTimer = 0;
    const angle = Math.atan2(g.player.y - b.y, g.player.x - b.x);
    for (let i = -Math.floor(params.spread / 2); i <= Math.floor(params.spread / 2); i++) {
      const a = angle + i * params.angleSpread;
      const speed = g.cfg.bulletSpeed * params.bulletSpeedMult;
      g.enemyBullets.push({
        x: b.x, y: b.y + 25,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
      });
    }
  }

  // v2 Sprint 2: CHIP LEADER 戦でスタック / Phase 更新
  if (g.stageNum === CHIP_LEADER_STAGE && b.chipLeaderPhase !== undefined) {
    updateChipLeaderStack(g);
  }
}

function updateChipLeaderStack(g: GameState) {
  if (!g.boss) return;
  const b = g.boss;
  const hpRatio = b.hp / b.maxHp;
  const targetPlayerStack = hpToPlayerStack(hpRatio);
  const fx = readFxConfig(typeof window !== "undefined" ? window.location.search : "");

  // Lerp で滑らかに追従
  if (g.playerStackBB === undefined) {
    g.playerStackBB = targetPlayerStack;
  } else {
    g.playerStackBB = g.playerStackBB + (targetPlayerStack - g.playerStackBB) * fx.stackLerp;
  }
  b.stackBB = playerStackToBossStack(g.playerStackBB);

  // Phase 判定と遷移検出 (発火は spawnPhaseTransition に集約)
  const newPhase = getChipLeaderPhase(hpRatio);
  const transitionKind = detectPhaseTransition(b.chipLeaderPhase, newPhase);
  if (transitionKind !== null) {
    spawnPhaseTransition(g, transitionKind);
  }
  b.chipLeaderPhase = newPhase;

  // 顔状態の自動導出（faceState + accessoryState）
  if (newPhase === 1) {
    b.faceState = "calm";
    b.accessoryState = "intact";
  } else if (newPhase === 2) {
    b.faceState = "sweat";
    b.accessoryState = "cracked";
  } else {
    b.faceState = "panic";
    b.accessoryState = "broken";
  }
}

// Phase 転換タイマー進行 (Game.tsx から呼び出す)
export function updatePhaseTransition(g: GameState) {
  if (!g.phaseTransition) return;
  g.phaseTransition.life--;
  if (g.phaseTransition.life <= 0) {
    g.phaseTransition = undefined;
  }
}

export const __test__ = {
  getShootParams,
};
