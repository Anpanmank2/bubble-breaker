import { GameState, CANVAS_H, CANVAS_W, addParticles } from "../state/GameState";
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
// Commit 3: production 環境では無効化 (ランキング/スコア操作防止)
function readBossHpScale(): number {
  if (typeof window === "undefined") return 1.0;
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") return 1.0;
  const v = new URLSearchParams(window.location.search).get("bossHpScale");
  if (v === null) return 1.0;
  const n = parseFloat(v);
  if (isNaN(n) || n <= 0 || n > 1) return 1.0;
  return n;
}

const SLOW_PLAYER_GOD_STAGE = 3;

export function ensureBoss(g: GameState) {
  if (g.boss) return;
  const isChipLeader = g.stageNum === CHIP_LEADER_STAGE;
  const isSlowPlayerGod = g.stageNum === SLOW_PLAYER_GOD_STAGE;
  const hpRatio = 1.0;
  const hpScale = readBossHpScale();
  const scaledMaxHp = Math.max(1, Math.round(g.cfg.bossHp * hpScale));
  // v2 縦画面化: ボスは画面上部中央に配置、X 方向に振動
  // y=130 で上部 HUD (stage info/stack bar) と衝突しない位置
  g.boss = {
    x: CANVAS_W / 2 - 25,
    y: 130,
    w: 50, h: 50,
    hp: scaledMaxHp,
    maxHp: scaledMaxHp,
    shootTimer: 0,
    sinOffset: 0,
    // v2 Sprint 2: CHIP LEADER 戦のみスタック管理
    stackBB: isChipLeader ? playerStackToBossStack(hpToPlayerStack(hpRatio)) : undefined,
    chipLeaderPhase: isChipLeader ? getChipLeaderPhase(hpRatio) : undefined,
    // v2 Sprint 2 Commit 3: SLOW PLAYER GOD (Stage 3) がワンアウター機構を持つ
    oneOuterUsed: isSlowPlayerGod ? false : undefined,
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
  // v2 縦画面化: 上部で X 方向に揺動
  b.x = CANVAS_W / 2 - 25 + Math.sin(b.sinOffset) * (CANVAS_W / 2 - 60);
  b.shootTimer++;

  const hpRatio = b.hp / b.maxHp;
  const params = getShootParams(g, hpRatio);

  // v2 Sprint 2 Commit 3: ワンアウター演出中はボス攻撃休止
  const inOneOuterSeq = g.oneOuterSequence !== undefined;

  if (!inOneOuterSeq && b.shootTimer >= params.shootInterval) {
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
    updateSunglassesAnim(b);
  }

  // v2 Sprint 2 Commit 3: SLOW PLAYER GOD ワンアウター発火検出
  if (g.stageNum === SLOW_PLAYER_GOD_STAGE) {
    checkOneOuter(g);
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
    // Commit 3: Phase 2→3 でサングラス吹っ飛びアニメ発火 + ガラス破片散布
    if (transitionKind === "CHIP_LEAD_CHANGE") {
      triggerSunglassesBlowoff(g);
    }
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

// v2 Sprint 2 Commit 3: サングラス吹っ飛びアニメ初期化 + ガラス破片散布
// synthesis §2 B3: vy=-8 上向き初速 → 放物線 → Frame 60 alpha=0 (= 1000ms @60fps)
// 藤井 art-direction §2-3: ガラス破片 #87ceeb 小片散布でドラマ増強
function triggerSunglassesBlowoff(g: GameState) {
  if (!g.boss) return;
  const b = g.boss;
  b.sunglassesY = 0;
  b.sunglassesRotation = 0;
  b.sunglassesAlpha = 1;
  b.sunglassesVy = -8; // 上向き初速 (放物線)
  b.sunglassesBlowoffLife = 60;
  // ガラス破片 6 粒をボス顔面付近から散布
  addParticles(g, b.x + b.w / 2, b.y + b.h / 2 - 6, "#87ceeb", 6);
}

function updateSunglassesAnim(b: import("../state/GameState").Boss) {
  if (!b.sunglassesBlowoffLife || b.sunglassesBlowoffLife <= 0) return;
  const vy = b.sunglassesVy ?? 0;
  b.sunglassesY = (b.sunglassesY ?? 0) + vy;
  b.sunglassesVy = vy + 0.5; // 重力
  b.sunglassesRotation = (b.sunglassesRotation ?? 0) + 0.1;
  b.sunglassesAlpha = Math.max(0, (b.sunglassesAlpha ?? 1) - 0.017);
  b.sunglassesBlowoffLife--;
}

// v2 Sprint 2 Commit 3: ワンアウター発火検出 (Stage 3 SLOW PLAYER GOD のみ)
// synthesis §2 B1: HP 25% 以下で 1 回のみ発火、回復量 maxHp * 0.30、演出 2000ms
function checkOneOuter(g: GameState) {
  if (!g.boss) return;
  const b = g.boss;
  if (b.oneOuterUsed !== false) return; // undefined or true → skip
  const fx = readFxConfig(typeof window !== "undefined" ? window.location.search : "");
  const hpRatio = b.hp / b.maxHp;
  if (hpRatio > fx.oneOuterThreshold) return;

  b.oneOuterUsed = true;
  const healAmount = Math.round(b.maxHp * fx.oneOuterHealAmount);
  b.hp = Math.min(b.maxHp, b.hp + healAmount);

  // 演出シーケンス開始 (2000ms)
  const lifeFrames = Math.max(1, Math.round(fx.oneOuterTextMs / (1000 / 60)));
  g.oneOuterSequence = { life: lifeFrames, maxLife: lifeFrames };
}

// Phase 転換タイマー進行 (Game.tsx から呼び出す)
export function updatePhaseTransition(g: GameState) {
  if (!g.phaseTransition) return;
  g.phaseTransition.life--;
  if (g.phaseTransition.life <= 0) {
    g.phaseTransition = undefined;
  }
}

// v2 Sprint 2 Commit 3: ワンアウター演出シーケンス進行
export function updateOneOuterSequence(g: GameState) {
  if (!g.oneOuterSequence) return;
  g.oneOuterSequence.life--;
  if (g.oneOuterSequence.life <= 0) {
    g.oneOuterSequence = undefined;
  }
}

export const __test__ = {
  getShootParams,
  triggerSunglassesBlowoff,
  updateSunglassesAnim,
  checkOneOuter,
};
