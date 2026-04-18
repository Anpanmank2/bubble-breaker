import { Card } from "./constants";
import { totalCardValue } from "./totalCardValue";

export type RealtimePower = {
  dmg: number;
  size: number;
  color: string;
  extra: number;
  label: string;
};

export function getRealtimePower(cards: Card[]): RealtimePower {
  if (cards.length === 0) {
    return { dmg: 2, size: 4, color: "#4ecdc4", extra: 0, label: "" };
  }

  const val = totalCardValue(cards);
  let mult = 1;
  let extra = 0;
  let label = "";

  if (cards.length >= 2) {
    const counts: Record<string, number> = {};
    cards.forEach((c) => (counts[c.rank] = (counts[c.rank] || 0) + 1));
    const maxCount = Math.max(...Object.values(counts));
    const pairs = Object.values(counts).filter((v) => v >= 2).length;

    if (maxCount >= 4) { mult = 2.5; extra = 2; label = "FOUR!"; }
    else if (maxCount >= 3 && pairs >= 2) { mult = 2.2; extra = 2; label = "FULL HOUSE!"; }
    else if (maxCount >= 3) { mult = 1.8; extra = 1; label = "TRIPS!"; }
    else if (pairs >= 2) { mult = 1.5; extra = 1; label = "TWO PAIR!"; }
    else if (maxCount >= 2) { mult = 1.3; extra = 0; label = "PAIR!"; }

    const suitCounts: Record<string, number> = {};
    cards.forEach((c) => (suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1));
    const maxSuit = Math.max(...Object.values(suitCounts));
    if (maxSuit >= 4) { mult += 0.5; label += " +FLUSH DRAW"; }
  }

  const baseDmg = 2 + val * 0.15;
  const dmg = baseDmg * mult;
  const size = Math.min(8, 3 + dmg * 0.3);

  let color = "#4ecdc4";
  if (dmg > 12) color = "#ffd700";
  else if (dmg > 8) color = "#ff9f43";
  else if (dmg > 5) color = "#a29bfe";

  return { dmg, size, color, extra, label };
}
