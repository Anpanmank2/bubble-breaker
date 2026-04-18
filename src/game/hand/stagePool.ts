import { Card, Rank, SUITS } from "./constants";

export const STAGE_CARD_POOLS: Record<number, Rank[]> = {
  1: ["Q", "K", "A"],
  2: ["T", "J", "Q", "K", "A"],
  3: ["T", "J", "Q", "K", "A"],
  4: ["T", "J", "Q", "K", "A"],
};

export function randomCardForStage(stageNum: number): Card {
  const pool = STAGE_CARD_POOLS[stageNum] || STAGE_CARD_POOLS[3];
  return {
    rank: pool[Math.floor(Math.random() * pool.length)],
    suit: SUITS[Math.floor(Math.random() * SUITS.length)],
  };
}
