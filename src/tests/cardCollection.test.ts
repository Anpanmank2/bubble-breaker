import { describe, it, expect } from "vitest";
import { evaluateHand } from "@/game/hand/evaluateHand";
import type { Card } from "@/game/hand/constants";

// v2 Sprint 2 Commit 4+1: カード補完廃止 (Owner FB 対応)
// Game.tsx の `while (cards.length < 5) cards.push(randomCardForStage(...))` 削除により、
// 5 枚未満で collect フェーズ終了した場合は補完せず evaluateHand に渡す。
// evaluateHand は 4 枚以下で HIGH_CARD / mult=1.0 を返す設計。

describe("5 枚未満でのカード役判定 (補完なし挙動)", () => {
  it("0 枚 → HIGH_CARD / mult 1.0", () => {
    const result = evaluateHand([]);
    expect(result.name).toBe("HIGH_CARD");
    expect(result.mult).toBe(1.0);
  });

  it("1 枚 → HIGH_CARD / mult 1.0", () => {
    const result = evaluateHand([{ rank: "A", suit: "♠" }]);
    expect(result.name).toBe("HIGH_CARD");
    expect(result.mult).toBe(1.0);
  });

  it("3 枚 → HIGH_CARD / mult 1.0", () => {
    const cards: Card[] = [
      { rank: "A", suit: "♠" },
      { rank: "K", suit: "♥" },
      { rank: "Q", suit: "♦" },
    ];
    const result = evaluateHand(cards);
    expect(result.name).toBe("HIGH_CARD");
    expect(result.mult).toBe(1.0);
  });

  it("4 枚 (ペア含む) → HIGH_CARD / mult 1.0 (役 penalty)", () => {
    const cards: Card[] = [
      { rank: "A", suit: "♠" },
      { rank: "A", suit: "♥" },
      { rank: "K", suit: "♦" },
      { rank: "Q", suit: "♣" },
    ];
    const result = evaluateHand(cards);
    expect(result.name).toBe("HIGH_CARD");
    expect(result.mult).toBe(1.0);
  });
});

describe("5 枚揃った場合は従来通り役判定", () => {
  it("5 枚 STRAIGHT (T-J-Q-K-A) → STRAIGHT", () => {
    const cards: Card[] = [
      { rank: "T", suit: "♠" },
      { rank: "J", suit: "♥" },
      { rank: "Q", suit: "♦" },
      { rank: "K", suit: "♣" },
      { rank: "A", suit: "♠" },
    ];
    const result = evaluateHand(cards);
    expect(result.name).toBe("STRAIGHT");
    expect(result.mult).toBeGreaterThan(1.0);
  });

  it("5 枚 ONE_PAIR", () => {
    const cards: Card[] = [
      { rank: "A", suit: "♠" },
      { rank: "A", suit: "♥" },
      { rank: "K", suit: "♦" },
      { rank: "Q", suit: "♣" },
      { rank: "J", suit: "♠" },
    ];
    const result = evaluateHand(cards);
    expect(result.name).toBe("ONE_PAIR");
    expect(result.mult).toBeGreaterThan(1.0);
  });
});
