import { describe, it, expect } from "vitest";
import type { Boss, GameState } from "@/game/state/GameState";
import { __test__, updateOneOuterSequence } from "@/game/managers/BossManager";

const { checkOneOuter } = __test__;

function makeStubGame(overrides: {
  stageNum: number;
  hp: number;
  maxHp: number;
  oneOuterUsed?: boolean | undefined;
}): GameState {
  const boss: Boss = {
    x: 0, y: 0, w: 50, h: 50,
    hp: overrides.hp,
    maxHp: overrides.maxHp,
    shootTimer: 0,
    sinOffset: 0,
    oneOuterUsed: overrides.oneOuterUsed,
  };
  return {
    boss,
    stageNum: overrides.stageNum,
    oneOuterSequence: undefined,
  } as unknown as GameState;
}

describe("checkOneOuter — 発火閾値 (default 25%)", () => {
  it("Stage 3 / HP 30% → 発火しない", () => {
    const g = makeStubGame({ stageNum: 3, hp: 24, maxHp: 80, oneOuterUsed: false });
    checkOneOuter(g);
    expect(g.boss!.oneOuterUsed).toBe(false);
    expect(g.oneOuterSequence).toBeUndefined();
  });

  it("Stage 3 / HP 25% 付近 → 発火する (hpRatio=0.25 で発火)", () => {
    const g = makeStubGame({ stageNum: 3, hp: 20, maxHp: 80, oneOuterUsed: false });
    checkOneOuter(g);
    expect(g.boss!.oneOuterUsed).toBe(true);
    expect(g.oneOuterSequence).toBeDefined();
  });

  it("Stage 3 / HP 10% → 発火する", () => {
    const g = makeStubGame({ stageNum: 3, hp: 8, maxHp: 80, oneOuterUsed: false });
    checkOneOuter(g);
    expect(g.boss!.oneOuterUsed).toBe(true);
    expect(g.boss!.hp).toBeGreaterThan(8); // HP が回復している
  });
});

describe("checkOneOuter — 1 回限定", () => {
  it("oneOuterUsed=true の場合は再発火しない", () => {
    const g = makeStubGame({ stageNum: 3, hp: 10, maxHp: 80, oneOuterUsed: true });
    const hpBefore = g.boss!.hp;
    checkOneOuter(g);
    expect(g.boss!.hp).toBe(hpBefore);
    expect(g.oneOuterSequence).toBeUndefined();
  });

  it("一度発火した後、HP が 25% 未満に再度下がっても再発火しない", () => {
    const g = makeStubGame({ stageNum: 3, hp: 10, maxHp: 80, oneOuterUsed: false });
    checkOneOuter(g); // 1st fire
    expect(g.boss!.oneOuterUsed).toBe(true);
    const hpAfterFirstFire = g.boss!.hp;

    // HP をさらに削る
    g.boss!.hp = 5;
    g.oneOuterSequence = undefined;
    checkOneOuter(g);
    expect(g.oneOuterSequence).toBeUndefined();
    expect(g.boss!.hp).toBe(5); // 回復しない
    void hpAfterFirstFire;
  });
});

describe("checkOneOuter — 回復量", () => {
  it("maxHp * 0.30 回復 (default)", () => {
    const g = makeStubGame({ stageNum: 3, hp: 10, maxHp: 80, oneOuterUsed: false });
    checkOneOuter(g);
    // 10 + 80 * 0.30 = 10 + 24 = 34
    expect(g.boss!.hp).toBe(34);
  });

  it("maxHp を超えない (cap 適用)", () => {
    const g = makeStubGame({ stageNum: 3, hp: 70, maxHp: 80, oneOuterUsed: false });
    // ratio = 70/80 = 0.875 > 0.25 → 発火しない (ratio が閾値外)
    checkOneOuter(g);
    expect(g.oneOuterSequence).toBeUndefined();
    expect(g.boss!.hp).toBe(70);
  });
});

describe("checkOneOuter — Stage 制約", () => {
  it("Stage 4 CHIP LEADER では発火しない (oneOuterUsed=undefined なので)", () => {
    const g = makeStubGame({ stageNum: 4, hp: 10, maxHp: 80, oneOuterUsed: undefined });
    checkOneOuter(g);
    expect(g.oneOuterSequence).toBeUndefined();
  });

  it("Stage 1-2 でも発火しない", () => {
    for (const stage of [1, 2]) {
      const g = makeStubGame({ stageNum: stage, hp: 10, maxHp: 80, oneOuterUsed: undefined });
      checkOneOuter(g);
      expect(g.oneOuterSequence).toBeUndefined();
    }
  });
});

describe("updateOneOuterSequence — シーケンス進行", () => {
  it("life を毎フレーム -1", () => {
    const g = {
      oneOuterSequence: { life: 10, maxLife: 10 },
    } as unknown as GameState;
    updateOneOuterSequence(g);
    expect(g.oneOuterSequence?.life).toBe(9);
  });

  it("life が 0 になったら undefined にリセット", () => {
    const g = {
      oneOuterSequence: { life: 1, maxLife: 10 },
    } as unknown as GameState;
    updateOneOuterSequence(g);
    expect(g.oneOuterSequence).toBeUndefined();
  });

  it("undefined は no-op", () => {
    const g = {} as GameState;
    expect(() => updateOneOuterSequence(g)).not.toThrow();
  });
});
