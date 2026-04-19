import { GameState, CANVAS_W, CANVAS_H, addParticles, addFloatingText } from "../state/GameState";
import { getEnemyColor } from "../stages/enemyStats";
import { hpToPlayerStack } from "../boss/bossPhases";
import { spawnChipBurst } from "../effects/chipParticles";

const CHIP_LEADER_STAGE = 4;
const CHIPS_PER_HIT_MIN = 3;
const CHIPS_PER_HIT_MAX = 5;

export type BossKillHandler = (g: GameState) => void;
export type DefeatEnemyHandler = () => void;

export function updateBullets(
  g: GameState,
  onBossDefeated: BossKillHandler,
  onEnemyKill: DefeatEnemyHandler,
) {
  g.bullets.forEach((b) => { b.x += b.speed; if (b.vy) b.y += b.vy; });
  g.enemyBullets.forEach((b) => { b.x += b.vx; b.y += b.vy; });

  g.bullets = g.bullets.filter((b) => {
    if (b.x > CANVAS_W) return false;
    let hit = false;

    if (g.boss && b.x > g.boss.x - 25 && b.x < g.boss.x + g.boss.w && b.y > g.boss.y - 10 && b.y < g.boss.y + g.boss.h + 10) {
      // v2 Sprint 2 Commit 2: CHIP LEADER 戦のみ BB delta + チップパーティクル
      const isChipLeader = g.stageNum === CHIP_LEADER_STAGE && g.boss.chipLeaderPhase !== undefined;
      const prevHpRatio = isChipLeader ? g.boss.hp / g.boss.maxHp : 0;
      g.boss.hp -= b.dmg;
      hit = true;
      addParticles(g, b.x, b.y, "#ffd700", 3);

      if (isChipLeader && g.boss && g.boss.hp > 0) {
        const newHpRatio = g.boss.hp / g.boss.maxHp;
        const deltaBB = hpToPlayerStack(newHpRatio) - hpToPlayerStack(prevHpRatio);
        const roundedDelta = Math.round(deltaBB);
        if (roundedDelta > 0) {
          addFloatingText(g, b.x, b.y - 12, `+${roundedDelta}BB`, "#4ade80");
          const count = CHIPS_PER_HIT_MIN + Math.floor(Math.random() * (CHIPS_PER_HIT_MAX - CHIPS_PER_HIT_MIN + 1));
          spawnChipBurst(g, b.x, b.y, "to-player", count, "#ffd700");
        }
      }

      if (g.boss && g.boss.hp <= 0) {
        g.bossDefeated = true;
        addParticles(g, g.boss.x, g.boss.y, "#ff4444", 20);
        g.boss = null;
        onBossDefeated(g);
      }
    }

    g.enemies.forEach((e) => {
      if (!hit && b.x > e.x - 10 && b.x < e.x + e.w && b.y > e.y - 10 && b.y < e.y + e.h) {
        e.hp -= b.dmg;
        hit = true;
        addParticles(g, b.x, b.y, getEnemyColor(e.type), 3);
      }
    });
    return !hit;
  });

  g.enemies = g.enemies.filter((e) => {
    if (e.hp <= 0) {
      addParticles(g, e.x, e.y, getEnemyColor(e.type), 8);
      g.score += 10;
      g.combo++;
      addFloatingText(g, e.x, e.y - 10, `+10`, "#fff");
      onEnemyKill();
      return false;
    }
    if (e.x < -30) return false;
    return true;
  });

  g.enemyBullets = g.enemyBullets.filter((b) => b.x > -10 && b.x < CANVAS_W + 10 && b.y > -10 && b.y < CANVAS_H + 10);
  g.enemies = g.enemies.filter((e) => e.x > -40);
}
