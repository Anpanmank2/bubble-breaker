import { describe, it, expect } from "vitest";
import { evaluateHand } from "@/game/hand/evaluateHand";
import { Card } from "@/game/hand/constants";

const c = (rank: string, suit: string): Card => ({ rank: rank as Card["rank"], suit: suit as Card["suit"] });

describe("evaluateHand — 10 役全網羅", () => {
  it("ROYAL_FLUSH (T-J-Q-K-A same suit)", () => {
    const r = evaluateHand([c("T", "♠"), c("J", "♠"), c("Q", "♠"), c("K", "♠"), c("A", "♠")]);
    expect(r.name).toBe("ROYAL_FLUSH");
    expect(r.mult).toBe(99);
  });

  it("STRAIGHT_FLUSH (8-9-T-J-Q same suit)", () => {
    const r = evaluateHand([c("8", "♥"), c("9", "♥"), c("T", "♥"), c("J", "♥"), c("Q", "♥")]);
    expect(r.name).toBe("STRAIGHT_FLUSH");
    expect(r.mult).toBe(8.0);
  });

  it("FOUR_KIND (A x4 + K)", () => {
    const r = evaluateHand([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("A", "♣"), c("K", "♠")]);
    expect(r.name).toBe("FOUR_KIND");
    expect(r.mult).toBe(5.0);
  });

  it("FULL_HOUSE (A x3 + K x2)", () => {
    const r = evaluateHand([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("K", "♣"), c("K", "♠")]);
    expect(r.name).toBe("FULL_HOUSE");
    expect(r.mult).toBe(4.0);
  });

  it("FLUSH (5 cards same suit non-sequential)", () => {
    const r = evaluateHand([c("8", "♠"), c("T", "♠"), c("Q", "♠"), c("K", "♠"), c("A", "♠")]);
    expect(r.name).toBe("FLUSH");
    expect(r.mult).toBe(3.5);
  });

  it("STRAIGHT (8-9-T-J-Q mixed suits)", () => {
    const r = evaluateHand([c("8", "♠"), c("9", "♥"), c("T", "♦"), c("J", "♣"), c("Q", "♠")]);
    expect(r.name).toBe("STRAIGHT");
    expect(r.mult).toBe(3.0);
  });

  it("STRAIGHT (T-J-Q-K-A mixed suits — high straight, not royal without flush)", () => {
    const r = evaluateHand([c("T", "♠"), c("J", "♥"), c("Q", "♦"), c("K", "♣"), c("A", "♠")]);
    expect(r.name).toBe("STRAIGHT");
  });

  it("THREE_KIND (A x3 + K + Q)", () => {
    const r = evaluateHand([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("K", "♣"), c("Q", "♠")]);
    expect(r.name).toBe("THREE_KIND");
    expect(r.mult).toBe(2.0);
  });

  it("TWO_PAIR (A x2 + K x2 + Q)", () => {
    const r = evaluateHand([c("A", "♠"), c("A", "♥"), c("K", "♦"), c("K", "♣"), c("Q", "♠")]);
    expect(r.name).toBe("TWO_PAIR");
    expect(r.mult).toBe(1.5);
  });

  it("ONE_PAIR (A x2 + K + Q + J)", () => {
    const r = evaluateHand([c("A", "♠"), c("A", "♥"), c("K", "♦"), c("Q", "♣"), c("J", "♠")]);
    expect(r.name).toBe("ONE_PAIR");
    expect(r.mult).toBe(1.2);
  });

  it("HIGH_CARD (all different ranks no flush/straight)", () => {
    const r = evaluateHand([c("8", "♠"), c("T", "♥"), c("Q", "♦"), c("K", "♣"), c("A", "♠")]);
    expect(r.name).toBe("HIGH_CARD");
    expect(r.mult).toBe(1.0);
  });
});

describe("evaluateHand — 境界ケース", () => {
  it("4枚だと HIGH_CARD で mult=1.0", () => {
    const r = evaluateHand([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("A", "♣")]);
    expect(r.name).toBe("HIGH_CARD");
    expect(r.mult).toBe(1.0);
  });

  it("空配列でも HIGH_CARD", () => {
    const r = evaluateHand([]);
    expect(r.name).toBe("HIGH_CARD");
  });

  it("T-J-Q-K-A 全同マーク = ROYAL_FLUSH (suit ♣)", () => {
    const r = evaluateHand([c("T", "♣"), c("J", "♣"), c("Q", "♣"), c("K", "♣"), c("A", "♣")]);
    expect(r.name).toBe("ROYAL_FLUSH");
  });

  it("8-9-T-J-Q 全同マーク = STRAIGHT_FLUSH ではあるが ROYAL ではない", () => {
    const r = evaluateHand([c("8", "♦"), c("9", "♦"), c("T", "♦"), c("J", "♦"), c("Q", "♦")]);
    expect(r.name).toBe("STRAIGHT_FLUSH");
  });

  it("9-T-J-Q-K 全同マーク = STRAIGHT_FLUSH", () => {
    const r = evaluateHand([c("9", "♦"), c("T", "♦"), c("J", "♦"), c("Q", "♦"), c("K", "♦")]);
    expect(r.name).toBe("STRAIGHT_FLUSH");
  });

  it("擬似連番 8-9-T-J-A (飛びあり) は STRAIGHT ではない = HIGH_CARD", () => {
    const r = evaluateHand([c("8", "♠"), c("9", "♥"), c("T", "♦"), c("J", "♣"), c("A", "♠")]);
    expect(r.name).toBe("HIGH_CARD");
  });
});
