import { describe, it, expect } from "vitest";
import { STAGE_CARD_POOLS, randomCardForStage } from "@/game/hand/stagePool";

// v2 (2026-04-18): 8/9 ランク廃止、Stage 3/4 も TJQKA 統一
describe("STAGE_CARD_POOLS — Stage 別カードプール", () => {
  it("Stage 1 = QKA のみ", () => {
    expect(STAGE_CARD_POOLS[1]).toEqual(["Q", "K", "A"]);
  });
  it("Stage 2 = TJQKA", () => {
    expect(STAGE_CARD_POOLS[2]).toEqual(["T", "J", "Q", "K", "A"]);
  });
  it("Stage 3 = TJQKA (v2 で Stage 2 と統一)", () => {
    expect(STAGE_CARD_POOLS[3]).toEqual(["T", "J", "Q", "K", "A"]);
  });
  it("Stage 4 = Stage 3 と同一", () => {
    expect(STAGE_CARD_POOLS[4]).toEqual(STAGE_CARD_POOLS[3]);
  });
});

describe("randomCardForStage", () => {
  it("Stage 1 は QKA のみを返す", () => {
    for (let i = 0; i < 200; i++) {
      const card = randomCardForStage(1);
      expect(["Q", "K", "A"]).toContain(card.rank);
    }
  });

  it("全ステージで 8/9 が絶対に出現しない (v2 不変条件)", () => {
    const allowed = new Set(["T", "J", "Q", "K", "A"]);
    for (const stageNum of [1, 2, 3, 4]) {
      for (let i = 0; i < 200; i++) {
        const card = randomCardForStage(stageNum);
        expect(allowed.has(card.rank)).toBe(true);
      }
    }
  });

  it("Stage 2+ は TJQKA 全 5 ランクを返し得る", () => {
    const set = new Set<string>();
    for (let i = 0; i < 500; i++) {
      set.add(randomCardForStage(2).rank);
    }
    expect(set.size).toBe(5);
  });
});
