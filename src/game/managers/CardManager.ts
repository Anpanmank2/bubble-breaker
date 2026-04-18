import { GameState, CANVAS_W, addParticles, addFloatingText } from "../state/GameState";
import { Card, RANK_VALUES } from "../hand/constants";
import { getRealtimePower } from "../hand/getRealtimePower";
import { randomCardForStage } from "../hand/stagePool";

export type OnCollectedChange = (cards: Card[]) => void;

export function spawnScheduledCard(g: GameState) {
  const dropInterval = Math.floor(g.collectDuration / (g.maxCardDrops + 1));
  if (g.stageTimer % dropInterval === 0 && g.cardDropCount < g.maxCardDrops) {
    const card = randomCardForStage(g.stageNum, g.cfg.junkRate);
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
        const isJunk = c.card.rank === "8" || c.card.rank === "9";
        addFloatingText(g, c.x, c.y - 15, `${c.card.rank}${c.card.suit}`, isJunk ? "#ff6b6b" : "#4ecdc4");
        if (isJunk) g.player.flash = 15;
      } else {
        let weakIdx = 0;
        let weakVal = RANK_VALUES[g.collectedCards[0].rank];
        g.collectedCards.forEach((cc, i) => {
          if (RANK_VALUES[cc.rank] < weakVal) { weakVal = RANK_VALUES[cc.rank]; weakIdx = i; }
        });
        if (RANK_VALUES[c.card.rank] > weakVal) {
          const old = g.collectedCards[weakIdx];
          g.collectedCards[weakIdx] = c.card;
          onChange([...g.collectedCards]);
          addFloatingText(g, c.x, c.y - 15, `${c.card.rank}${c.card.suit} → ${old.rank}${old.suit}`, "#ffd93d");
        } else {
          addFloatingText(g, c.x, c.y - 15, "SKIP", "#888");
        }
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
