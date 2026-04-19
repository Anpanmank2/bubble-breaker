import { describe, it, expect } from "vitest";
import { __test__ } from "@/game/managers/EnemyManager";

const { rollChipValue, CHIP_DISTRIBUTION } = __test__;

describe("ドンクチップ 3 色分布 ($5 40% / $25 40% / $100 20%)", () => {
  it("CHIP_DISTRIBUTION の合計が 1.0", () => {
    const sum = CHIP_DISTRIBUTION.reduce((s, c) => s + c.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("$5 (白) が 40%", () => {
    const entry = CHIP_DISTRIBUTION.find((c) => c.value === 5);
    expect(entry?.weight).toBe(0.4);
  });

  it("$25 (赤) が 40%", () => {
    const entry = CHIP_DISTRIBUTION.find((c) => c.value === 25);
    expect(entry?.weight).toBe(0.4);
  });

  it("$100 (緑) が 20%", () => {
    const entry = CHIP_DISTRIBUTION.find((c) => c.value === 100);
    expect(entry?.weight).toBe(0.2);
  });

  it("1000 回抽選で分布が期待値に近い (±5%)", () => {
    const counts: Record<number, number> = { 5: 0, 25: 0, 100: 0 };
    for (let i = 0; i < 1000; i++) {
      counts[rollChipValue()]++;
    }
    expect(counts[5] / 1000).toBeCloseTo(0.4, 1);
    expect(counts[25] / 1000).toBeCloseTo(0.4, 1);
    expect(counts[100] / 1000).toBeCloseTo(0.2, 1);
  });

  it("結果は必ず 5, 25, 100 のいずれか", () => {
    for (let i = 0; i < 50; i++) {
      const v = rollChipValue();
      expect([5, 25, 100]).toContain(v);
    }
  });
});
