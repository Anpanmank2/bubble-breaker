import { Card, Rank, SUITS } from "./constants";

export const STAGE_CARD_POOLS: Record<number, Rank[]> = {
  1: ["Q", "K", "A"],
  2: ["T", "J", "Q", "K", "A"],
  3: ["8", "9", "T", "J", "Q", "K", "A"],
  4: ["8", "9", "T", "J", "Q", "K", "A"],
};

export function randomCardForStage(stageNum: number, junkRate = 0): Card {
  const pool = STAGE_CARD_POOLS[stageNum] || STAGE_CARD_POOLS[3];
  if (junkRate > 0 && Math.random() < junkRate) {
    const junkCards = pool.filter((r) => r === "8" || r === "9");
    if (junkCards.length > 0) {
      return {
        rank: junkCards[Math.floor(Math.random() * junkCards.length)],
        suit: SUITS[Math.floor(Math.random() * SUITS.length)],
      };
    }
  }
  return {
    rank: pool[Math.floor(Math.random() * pool.length)],
    suit: SUITS[Math.floor(Math.random() * SUITS.length)],
  };
}
