import { GameState, CANVAS_W, CANVAS_H, ChipValue } from "../state/GameState";
import { getEnemyHp, stageEnemyTypes, EnemyType } from "../stages/enemyStats";
import { ENEMY_DIALOG_LINES } from "../characters/constants";

// v2 Sprint 2 Commit 4: ドンクチップ弾 ($5白 40% / $25赤 40% / $100緑 20%)
const CHIP_DISTRIBUTION: Array<{ value: ChipValue; weight: number }> = [
  { value: 5, weight: 0.4 },
  { value: 25, weight: 0.4 },
  { value: 100, weight: 0.2 },
];

function rollChipValue(): ChipValue {
  const r = Math.random();
  let acc = 0;
  for (const entry of CHIP_DISTRIBUTION) {
    acc += entry.weight;
    if (r < acc) return entry.value;
  }
  return 5;
}

const DIALOG_LIFE_FRAMES = 90; // 1500ms @60fps
const SPAWN_DIALOG_CHANCE = 0.3;
const HP_HALF_DIALOG_CHANCE = 0.5;

function pickDialog(type: EnemyType): string | null {
  const lines = ENEMY_DIALOG_LINES[type];
  if (!lines || lines.length === 0) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}

function setDialog(e: GameState["enemies"][number], type: EnemyType) {
  const line = pickDialog(type);
  if (!line) return;
  e.dialogText = line;
  e.dialogLife = DIALOG_LIFE_FRAMES;
  e.dialogMaxLife = DIALOG_LIFE_FRAMES;
}

export function spawnEnemy(g: GameState) {
  const cfg = g.cfg;
  const types = stageEnemyTypes(g.stageNum);
  const type = types[Math.floor(Math.random() * types.length)];
  // v2 縦画面化: 上端から下向きに進行
  const enemy = {
    x: 30 + Math.random() * (CANVAS_W - 60),
    y: -20,
    type,
    hp: getEnemyHp(type, cfg),
    maxHp: getEnemyHp(type, cfg),
    speed: cfg.enemySpeed * (0.8 + Math.random() * 0.4),
    shootTimer: 60 + Math.floor(Math.random() * 60),
    w: 20,
    h: 20,
    sinOffset: Math.random() * Math.PI * 2,
    sinAmp: 20 + Math.random() * 40,
    hpHalfTriggered: false,
  };
  // 出現時 30% でセリフ
  if (Math.random() < SPAWN_DIALOG_CHANCE) {
    const line = pickDialog(type);
    if (line) {
      Object.assign(enemy, {
        dialogText: line,
        dialogLife: DIALOG_LIFE_FRAMES,
        dialogMaxLife: DIALOG_LIFE_FRAMES,
      });
    }
  }
  g.enemies.push(enemy);
}

export function updateEnemies(g: GameState) {
  g.enemies.forEach((e) => {
    // v2 縦画面化: 主進行軸を Y (下方向)、揺らぎを X 方向に
    if (e.type === "gaba") {
      e.y += e.speed * 0.8;
      e.x += Math.sin(g.stageTimer * 0.05 + e.sinOffset) * 2;
      if (Math.random() < 0.005) e.speed *= 2.5;
    } else if (e.type === "callstation") {
      e.y += e.speed * 0.5;
      e.x += Math.sin(g.stageTimer * 0.03 + e.sinOffset) * e.sinAmp * 0.02;
    } else if (e.type === "slowplay") {
      e.y += e.speed * (Math.random() < 0.01 ? 3 : 0.6);
      e.x += Math.sin(g.stageTimer * 0.04 + e.sinOffset) * 1.5;
    } else {
      e.y += e.speed;
      e.x += Math.sin(g.stageTimer * 0.04 + e.sinOffset) * e.sinAmp * 0.015;
    }

    // HP 50% 通過時に 50% でセリフ (1 回のみ)
    if (!e.hpHalfTriggered && e.hp <= e.maxHp * 0.5) {
      e.hpHalfTriggered = true;
      if (Math.random() < HP_HALF_DIALOG_CHANCE) {
        setDialog(e, e.type);
      }
    }

    // Dialog life 減算
    if (e.dialogLife !== undefined && e.dialogLife > 0) {
      e.dialogLife--;
      if (e.dialogLife <= 0) {
        e.dialogText = undefined;
        e.dialogLife = undefined;
        e.dialogMaxLife = undefined;
      }
    }

    e.shootTimer--;
    if (e.shootTimer <= 0 && e.type !== "limp") {
      e.shootTimer = 80 + Math.floor(Math.random() * 60);
      const angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
      // v2 Sprint 2 Commit 4: donk は 3 色チップ弾 (放物線 gravity 0.08)
      if (e.type === "donk") {
        const chipValue = rollChipValue();
        const speed = g.cfg.bulletSpeed * 0.9;
        g.enemyBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5, // 上向き初速で放物線開始
          style: "chip",
          chipValue,
          gravity: 0.08,
          rotation: 0,
          rotationSpeed: 0.14, // ≒ 8°/frame
        });
      } else {
        g.enemyBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * g.cfg.bulletSpeed,
          vy: Math.sin(angle) * g.cfg.bulletSpeed,
        });
      }
    }
  });
}

export const __test__ = {
  rollChipValue,
  pickDialog,
  CHIP_DISTRIBUTION,
  DIALOG_LIFE_FRAMES,
};
