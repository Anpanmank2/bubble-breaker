import { GameState, CANVAS_H, CANVAS_W } from "../state/GameState";

export function ensureBoss(g: GameState) {
  if (g.boss) return;
  g.boss = {
    x: CANVAS_W - 80,
    y: CANVAS_H / 2 - 40,
    w: 50, h: 50,
    hp: g.cfg.bossHp,
    maxHp: g.cfg.bossHp,
    shootTimer: 0,
    sinOffset: 0,
    phase: 0,
  };
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
}
