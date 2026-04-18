import { describe, it, expect } from "vitest";
import { evaluateHand } from "@/game/hand/evaluateHand";
import { Card } from "@/game/hand/constants";

const c = (rank: string, suit: string): Card => ({ rank: rank as Card["rank"], suit: suit as Card["suit"] });

// v2 (2026-04-18): 5 ランク T-J-Q-K-A 化に伴い、以下の役は構造的に出現不能:
// - 非ロイヤル Straight Flush (5 枚同スート = ranks 全揃 = ROYAL 必発)
// - 非ストレート Flush (同上)
// - HIGH_CARD (5 枚全ランク異なる = ストレート必発)

describe("evaluateHand — 5-rank 環境で到達可能な役", () => {
  it("ROYAL_FLUSH (T-J-Q-K-A same suit)", () => {
    const r = evaluateHand([c("T", "♠"), c("J", "♠"), c("Q", "♠"), c("K", "♠"), c("A", "♠")]);
    expect(r.name).toBe("ROYAL_FLUSH");
    expect(r.mult).toBe(99);
  });

  it("FOUR_KIND (A x4 + K)", () => {
    const r = evaluateHand([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("A", "♣"), c("K", "♠")]);
    expect(r.name).toBe("FOUR_KIND");
    expect(r.mult).toBe(5.0);
  });

  it("STRAIGHT (T-J-Q-K-A mixed suits) — 5 ランクラバで自動成立、倍率 4.5", () => {
    const r = evaluateHand([c("T", "♠"), c("J", "♥"), c("Q", "♦"), c("K", "♣"), c("A", "♠")]);
    expect(r.name).toBe("STRAIGHT");
    expect(r.mult).toBe(4.5);
  });

  it("FULL_HOUSE (A x3 + K x2) — STRAIGHT より下位、倍率 4.0", () => {
    const r = evaluateHand([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("K", "♣"), c("K", "♠")]);
    expect(r.name).toBe("FULL_HOUSE");
    expect(r.mult).toBe(4.0);
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

  it("T-J-Q-K-A 全同マーク ♣ = ROYAL_FLUSH", () => {
    const r = evaluateHand([c("T", "♣"), c("J", "♣"), c("Q", "♣"), c("K", "♣"), c("A", "♣")]);
    expect(r.name).toBe("ROYAL_FLUSH");
  });
});

describe("evaluateHand — 5-rank 不変条件 (v2 仕様)", () => {
  it("5 枚ラバ = 必ず STRAIGHT (5 ランクしかないためハイカード不在)", () => {
    const r = evaluateHand([c("T", "♠"), c("J", "♥"), c("Q", "♦"), c("K", "♣"), c("A", "♠")]);
    expect(r.name).toBe("STRAIGHT");
  });

  it("5 枚同スート = 必ず ROYAL_FLUSH (非ロイヤル SF / Flush は構造的に不可能)", () => {
    // 5 ランクから 5 枚選択 × 全同スート → 全ランク必発 → ROYAL
    const r = evaluateHand([c("T", "♠"), c("J", "♠"), c("Q", "♠"), c("K", "♠"), c("A", "♠")]);
    expect(r.name).toBe("ROYAL_FLUSH");
  });
});
