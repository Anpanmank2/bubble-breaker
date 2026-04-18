import { GameState, CANVAS_H, CANVAS_W } from "../state/GameState";
import {
  hpToPlayerStack,
  getChipLeaderPhase,
  playerStackToBossStack,
  detectPhaseTransition,
} from "../boss/bossPhases";
import { readFxConfig } from "../effects/fxConfig";

const CHIP_LEADER_STAGE = 4;

export function ensureBoss(g: GameState) {
  if (g.boss) return;
  const isChipLeader = g.stageNum === CHIP_LEADER_STAGE;
  const hpRatio = 1.0;
  g.boss = {
    x: CANVAS_W - 80,
    y: CANVAS_H / 2 - 40,
    w: 50, h: 50,
    hp: g.cfg.bossHp,
    maxHp: g.cfg.bossHp,
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

  const shootInterval = b.hp < b.maxHp * 0.3 ? 15 : b.hp < b.maxHp * 0.6 ? 25 : 35;
  if (b.shootTimer >= shootInterval) {
    b.shootTimer = 0;
    const angle = Math.atan2(g.player.y - b.y, g.player.x - b.x);
    const spread = b.hp < b.maxHp * 0.3 ? 3 : b.hp < b.maxHp * 0.6 ? 2 : 1;
    for (let i = -Math.floor(spread / 2); i <= Math.floor(spread / 2); i++) {
      const a = angle + i * 0.2;
      g.enemyBullets.push({
        x: b.x, y: b.y + 25,
        vx: Math.cos(a) * g.cfg.bulletSpeed,
        vy: Math.sin(a) * g.cfg.bulletSpeed,
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

  // Phase 判定と遷移検出
  const newPhase = getChipLeaderPhase(hpRatio);
  const transitionKind = detectPhaseTransition(b.chipLeaderPhase, newPhase);
  if (transitionKind !== null) {
    const durationMs = transitionKind === "EVEN_STACK" ? fx.evenStackMs : fx.chipLeadChangeMs;
    const durationFrames = Math.round(durationMs / (1000 / 60));
    g.phaseTransition = {
      kind: transitionKind,
      life: durationFrames,
      maxLife: durationFrames,
    };
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
