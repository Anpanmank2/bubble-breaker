import { GameState, CANVAS_W, addParticles, addFloatingText } from "../state/GameState";
import { Card } from "../hand/constants";
import { getRealtimePower } from "../hand/getRealtimePower";
import { randomCardForStage } from "../hand/stagePool";

export type OnCollectedChange = (cards: Card[]) => void;

export function spawnScheduledCard(g: GameState) {
  const dropInterval = Math.floor(g.collectDuration / (g.maxCardDrops + 1));
  if (g.stageTimer % dropInterval === 0 && g.cardDropCount < g.maxCardDrops) {
    const card = randomCardForStage(g.stageNum);
    g.cards.push({
      x: CANVAS_W + 10,
      y: 50 + Math.random() * (720 - 200),
      card,
      speed: 1.2 + Math.random() * 0.5,
      sinOffset: Math.random() * Math.PI * 2,
      sinAmp: 15 + Math.random() * 25,
      time: 0,
      glow: 0,
    });
    g.cardDropCount++;
  }
}

export function updateCards(g: GameState, onChange: OnCollectedChange) {
  g.cards.forEach((c) => {
    c.x -= c.speed;
    c.time++;
    c.y += Math.sin(c.time * 0.03 + c.sinOffset) * c.sinAmp * 0.015;
    c.glow = Math.sin(c.time * 0.08) * 0.3 + 0.7;
  });

  g.cards = g.cards.filter((c) => {
    if (c.x < -30) return false;
    const dx = g.player.x - c.x;
    const dy = g.player.y - c.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) {
      const prevPower = getRealtimePower(g.collectedCards);

      if (g.collectedCards.length < 5) {
        g.collectedCards.push(c.card);
        onChange([...g.collectedCards]);
        addFloatingText(g, c.x, c.y - 15, `${c.card.rank}${c.card.suit}`, "#4ecdc4");
      } else {
        // v2: 入替禁止 (Owner decision 2026-04-18 / Markov 崩壊回避)
        // 5 枚埋まったら以降のカードは無視
        addFloatingText(g, c.x, c.y - 15, "FULL", "#888");
      }

      const newPower = getRealtimePower(g.collectedCards);
      if (newPower.label && newPower.label !== prevPower.label) {
        addFloatingText(g, g.player.x, g.player.y - 35, newPower.label, newPower.color);
        addParticles(g, g.player.x, g.player.y, newPower.color, 10);
      }

      return false;
    }
    return true;
  });
}
