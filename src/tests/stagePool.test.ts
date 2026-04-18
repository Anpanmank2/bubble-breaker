import { describe, it, expect } from "vitest";
import { STAGE_CARD_POOLS, randomCardForStage } from "@/game/hand/stagePool";

describe("STAGE_CARD_POOLS — Stage 別カードプール", () => {
  it("Stage 1 = QKA のみ", () => {
    expect(STAGE_CARD_POOLS[1]).toEqual(["Q", "K", "A"]);
  });
  it("Stage 2 = TJQKA", () => {
    expect(STAGE_CARD_POOLS[2]).toEqual(["T", "J", "Q", "K", "A"]);
  });
  it("Stage 3 = 8 から A まで 7 種", () => {
    expect(STAGE_CARD_POOLS[3]).toEqual(["8", "9", "T", "J", "Q", "K", "A"]);
  });
  it("Stage 4 = Stage 3 と同じフルレンジ", () => {
    expect(STAGE_CARD_POOLS[4]).toEqual(STAGE_CARD_POOLS[3]);
  });
});

describe("randomCardForStage", () => {
  it("Stage 1 は junk (8/9) を絶対に出さない", () => {
    for (let i = 0; i < 200; i++) {
      const card = randomCardForStage(1, 0.5);
      expect(["Q", "K", "A"]).toContain(card.rank);
    }
  });

  it("Stage 3 junkRate=1 では 8/9 だけを返す", () => {
    for (let i = 0; i < 100; i++) {
      const card = randomCardForStage(3, 1);
      expect(["8", "9"]).toContain(card.rank);
    }
  });

  it("Stage 3 junkRate=0 では 8-A までの全ランクを返し得る", () => {
    const set = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const card = randomCardForStage(3, 0);
      set.add(card.rank);
    }
    expect(set.size).toBeGreaterThan(3);
  });
});
