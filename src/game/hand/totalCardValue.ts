import { Card, RANK_VALUES } from "./constants";

export function totalCardValue(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + RANK_VALUES[c.rank], 0);
}
