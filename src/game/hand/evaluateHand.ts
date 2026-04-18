import { Card, HandName, HAND_MULTIPLIERS, RANK_ORDER } from "./constants";

export type HandResult = { name: HandName; mult: number };

export function evaluateHand(cards: Card[]): HandResult {
  if (cards.length < 5) {
    return { name: "HIGH_CARD", mult: 1.0 };
  }
  const ranks = cards.map((c) => RANK_ORDER[c.rank]).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);
  const isStraight = new Set(ranks).size === 5 && ranks[4] - ranks[0] === 4;
  const isRoyal = isStraight && ranks[0] === 2 && ranks[4] === 6; // T-J-Q-K-A

  if (isFlush && isRoyal) return { name: "ROYAL_FLUSH", mult: HAND_MULTIPLIERS.ROYAL_FLUSH };
  if (isFlush && isStraight) return { name: "STRAIGHT_FLUSH", mult: HAND_MULTIPLIERS.STRAIGHT_FLUSH };

  const counts: Record<number, number> = {};
  ranks.forEach((r) => (counts[r] = (counts[r] || 0) + 1));
  const vals = Object.values(counts).sort((a, b) => b - a);

  if (vals[0] === 4) return { name: "FOUR_KIND", mult: HAND_MULTIPLIERS.FOUR_KIND };
  if (vals[0] === 3 && vals[1] === 2) return { name: "FULL_HOUSE", mult: HAND_MULTIPLIERS.FULL_HOUSE };
  if (isFlush) return { name: "FLUSH", mult: HAND_MULTIPLIERS.FLUSH };
  if (isStraight) return { name: "STRAIGHT", mult: HAND_MULTIPLIERS.STRAIGHT };
  if (vals[0] === 3) return { name: "THREE_KIND", mult: HAND_MULTIPLIERS.THREE_KIND };
  if (vals[0] === 2 && vals[1] === 2) return { name: "TWO_PAIR", mult: HAND_MULTIPLIERS.TWO_PAIR };
  if (vals[0] === 2) return { name: "ONE_PAIR", mult: HAND_MULTIPLIERS.ONE_PAIR };
  return { name: "HIGH_CARD", mult: HAND_MULTIPLIERS.HIGH_CARD };
}
