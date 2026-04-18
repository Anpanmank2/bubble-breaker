import { GameState, CANVAS_W, CANVAS_H } from "../state/GameState";
import { getEnemyHp, stageEnemyTypes } from "../stages/enemyStats";

export function spawnEnemy(g: GameState) {
  const cfg = g.cfg;
  const types = stageEnemyTypes(g.stageNum);
  const type = types[Math.floor(Math.random() * types.length)];
  g.enemies.push({
    x: CANVAS_W + 20,
    y: 60 + Math.random() * (CANVAS_H - 200),
    type,
    hp: getEnemyHp(type, cfg),
    maxHp: getEnemyHp(type, cfg),
    speed: cfg.enemySpeed * (0.8 + Math.random() * 0.4),
    shootTimer: 60 + Math.floor(Math.random() * 60),
    w: 20,
    h: 20,
    sinOffset: Math.random() * Math.PI * 2,
    sinAmp: 20 + Math.random() * 40,
  });
}

export function updateEnemies(g: GameState) {
  g.enemies.forEach((e) => {
    if (e.type === "gaba") {
      e.x -= e.speed * 0.8;
      e.y += Math.sin(g.stageTimer * 0.05 + e.sinOffset) * 2;
      if (Math.random() < 0.005) e.speed *= 2.5;
    } else if (e.type === "callstation") {
      e.x -= e.speed * 0.5;
      e.y += Math.sin(g.stageTimer * 0.03 + e.sinOffset) * e.sinAmp * 0.02;
    } else if (e.type === "slowplay") {
      e.x -= e.speed * (Math.random() < 0.01 ? 3 : 0.6);
      e.y += Math.sin(g.stageTimer * 0.04 + e.sinOffset) * 1.5;
    } else {
      e.x -= e.speed;
      e.y += Math.sin(g.stageTimer * 0.04 + e.sinOffset) * e.sinAmp * 0.015;
    }

    e.shootTimer--;
    if (e.shootTimer <= 0 && e.type !== "limp") {
      e.shootTimer = 80 + Math.floor(Math.random() * 60);
      const angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
      g.enemyBullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(angle) * g.cfg.bulletSpeed,
        vy: Math.sin(angle) * g.cfg.bulletSpeed,
      });
    }
  });
}
