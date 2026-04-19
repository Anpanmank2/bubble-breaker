import { describe, it, expect } from "vitest";
import {
  hpToPlayerStack,
  getChipLeaderPhase,
  playerStackToBossStack,
  detectPhaseTransition,
} from "@/game/boss/bossPhases";

describe("hpToPlayerStack — tanh S字換算", () => {
  it("HP 100% (絶望) → 20BB 付近", () => {
    const v = hpToPlayerStack(1.0);
    expect(v).toBeGreaterThanOrEqual(19);
    expect(v).toBeLessThanOrEqual(21);
  });

  it("HP 0% (逆転完了) → 100BB 付近", () => {
    const v = hpToPlayerStack(0.0);
    expect(v).toBeGreaterThanOrEqual(99);
    expect(v).toBeLessThanOrEqual(101);
  });

  it("HP 50% (中点) → 60BB 付近", () => {
    const v = hpToPlayerStack(0.5);
    expect(v).toBeGreaterThanOrEqual(55);
    expect(v).toBeLessThanOrEqual(65);
  });

  it("Phase 1→2 境界 (HP 60%) → スナップで 40BB 厳密", () => {
    expect(hpToPlayerStack(0.6)).toBe(40);
    // スナップ窓内
    expect(hpToPlayerStack(0.61)).toBe(40);
    expect(hpToPlayerStack(0.59)).toBe(40);
  });

  it("Phase 2→3 境界 (HP 20%) → スナップで 80BB 厳密", () => {
    expect(hpToPlayerStack(0.2)).toBe(80);
    expect(hpToPlayerStack(0.21)).toBe(80);
    expect(hpToPlayerStack(0.19)).toBe(80);
  });

  it("境界外は tanh S 字の連続値", () => {
    // スナップ窓外の値はスナップされない
    expect(hpToPlayerStack(0.63)).not.toBe(40);
    expect(hpToPlayerStack(0.17)).not.toBe(80);
  });

  it("HP 単調減少 → player stack 単調増加", () => {
    const samples = [1.0, 0.9, 0.8, 0.7, 0.55, 0.5, 0.45, 0.3, 0.18, 0.1, 0.0];
    for (let i = 1; i < samples.length; i++) {
      const prev = hpToPlayerStack(samples[i - 1]);
      const curr = hpToPlayerStack(samples[i]);
      expect(curr).toBeGreaterThanOrEqual(prev - 0.1); // 同値または増加
    }
  });
});

describe("getChipLeaderPhase", () => {
  it("HP 60% 超は Phase 1", () => {
    expect(getChipLeaderPhase(1.0)).toBe(1);
    expect(getChipLeaderPhase(0.8)).toBe(1);
    expect(getChipLeaderPhase(0.65)).toBe(1);
  });

  it("HP 20% 超〜60% 以下は Phase 2", () => {
    expect(getChipLeaderPhase(0.6)).toBe(2);
    expect(getChipLeaderPhase(0.5)).toBe(2);
    expect(getChipLeaderPhase(0.25)).toBe(2);
  });

  it("HP 20% 以下は Phase 3", () => {
    expect(getChipLeaderPhase(0.2)).toBe(3);
    expect(getChipLeaderPhase(0.1)).toBe(3);
    expect(getChipLeaderPhase(0.0)).toBe(3);
  });
});

describe("playerStackToBossStack — ゼロサム維持", () => {
  it("player + boss = 120BB 厳密", () => {
    for (const playerStack of [20, 40, 60, 80, 100]) {
      expect(playerStack + playerStackToBossStack(playerStack)).toBe(120);
    }
  });

  it("小数も正しく扱う", () => {
    const boss = playerStackToBossStack(47.8);
    expect(Math.round(boss * 10) / 10).toBe(72.2);
  });
});

describe("detectPhaseTransition", () => {
  it("Phase 1→2 で EVEN_STACK 発火", () => {
    expect(detectPhaseTransition(1, 2)).toBe("EVEN_STACK");
  });

  it("Phase 2→3 で CHIP_LEAD_CHANGE 発火", () => {
    expect(detectPhaseTransition(2, 3)).toBe("CHIP_LEAD_CHANGE");
  });

  it("同じ Phase なら null", () => {
    expect(detectPhaseTransition(1, 1)).toBeNull();
    expect(detectPhaseTransition(2, 2)).toBeNull();
    expect(detectPhaseTransition(3, 3)).toBeNull();
  });

  it("prev 未定義 (初回) は null", () => {
    expect(detectPhaseTransition(undefined, 1)).toBeNull();
    expect(detectPhaseTransition(undefined, 2)).toBeNull();
  });

  it("Phase 1→3 直接遷移は CHIP_LEAD_CHANGE (bossHpScale QA や一撃大ダメージで発生)", () => {
    // mid-audit MEDIUM-2 修正: Phase 境界を跨いでも演出は必ず発火
    expect(detectPhaseTransition(1, 3)).toBe("CHIP_LEAD_CHANGE");
  });
});
