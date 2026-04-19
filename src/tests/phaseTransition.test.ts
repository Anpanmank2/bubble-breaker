import { describe, it, expect } from "vitest";
import type { GameState } from "@/game/state/GameState";
import {
  spawnPhaseTransition,
  isPhaseImmune,
  updatePhaseImmunity,
  __test__,
} from "@/game/effects/phaseTransition";

const { msToFrames } = __test__;

function makeStubState(): GameState {
  return {
    chipParticles: [],
    phaseTransition: undefined,
    phaseImmuneRemain: undefined,
  } as unknown as GameState;
}

describe("spawnPhaseTransition — kind 別 maxLife (60fps 換算)", () => {
  it("EVEN_STACK は 1000ms ≒ 60 frame", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "EVEN_STACK", "");
    expect(g.phaseTransition?.kind).toBe("EVEN_STACK");
    expect(g.phaseTransition?.maxLife).toBe(msToFrames(1000));
    expect(g.phaseTransition?.life).toBe(msToFrames(1000));
  });

  it("CHIP_LEAD_CHANGE は 1500ms ≒ 90 frame", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "CHIP_LEAD_CHANGE", "");
    expect(g.phaseTransition?.maxLife).toBe(msToFrames(1500));
  });

  it("ALL_IN_CHIP は 800ms ≒ 48 frame", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "ALL_IN_CHIP", "");
    expect(g.phaseTransition?.maxLife).toBe(msToFrames(800));
  });

  it("ALL_IN_3BET は 600ms ≒ 36 frame", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "ALL_IN_3BET", "");
    expect(g.phaseTransition?.maxLife).toBe(msToFrames(600));
  });
});

describe("spawnPhaseTransition — URL param 上書き", () => {
  it("?fxDuration=200 で全 kind が短縮される", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "EVEN_STACK", "?fxDuration=200");
    expect(g.phaseTransition?.maxLife).toBe(msToFrames(200));
  });

  it("?evenStackMs=500 で EVEN_STACK のみ上書き", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "EVEN_STACK", "?evenStackMs=500");
    expect(g.phaseTransition?.maxLife).toBe(msToFrames(500));
  });

  it("?chipLeadChangeMs=2000 で CHIP_LEAD_CHANGE が伸びる", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "CHIP_LEAD_CHANGE", "?chipLeadChangeMs=2000");
    expect(g.phaseTransition?.maxLife).toBe(msToFrames(2000));
  });
});

describe("spawnPhaseTransition — 連続 spawn と被弾無効", () => {
  it("連続 spawn で後発の kind が勝つ", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "EVEN_STACK", "");
    expect(g.phaseTransition?.kind).toBe("EVEN_STACK");
    spawnPhaseTransition(g, "CHIP_LEAD_CHANGE", "");
    expect(g.phaseTransition?.kind).toBe("CHIP_LEAD_CHANGE");
  });

  it("phaseImmuneRemain が phaseImmuneMs (default 800) フレーム数で設定される", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "EVEN_STACK", "");
    expect(g.phaseImmuneRemain).toBe(msToFrames(800));
    expect(isPhaseImmune(g)).toBe(true);
  });

  it("?phaseImmuneMs=400 で短縮される", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "EVEN_STACK", "?phaseImmuneMs=400");
    expect(g.phaseImmuneRemain).toBe(msToFrames(400));
  });

  it("チップパーティクルが 20 粒一斉発射される", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "EVEN_STACK", "");
    expect(g.chipParticles?.length).toBe(20);
  });

  it("ALL_IN_* は to-boss 方向", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "ALL_IN_CHIP", "");
    const allToBoss = g.chipParticles!.every((p) => p.kind === "to-boss");
    expect(allToBoss).toBe(true);
  });

  it("EVEN_STACK / CHIP_LEAD_CHANGE は to-player 方向", () => {
    const g = makeStubState();
    spawnPhaseTransition(g, "CHIP_LEAD_CHANGE", "");
    const allToPlayer = g.chipParticles!.every((p) => p.kind === "to-player");
    expect(allToPlayer).toBe(true);
  });
});

describe("updatePhaseImmunity / isPhaseImmune", () => {
  it("毎フレーム残量を 1 減らす", () => {
    const g = makeStubState();
    g.phaseImmuneRemain = 5;
    updatePhaseImmunity(g);
    expect(g.phaseImmuneRemain).toBe(4);
  });

  it("0 になったら undefined にリセット", () => {
    const g = makeStubState();
    g.phaseImmuneRemain = 1;
    updatePhaseImmunity(g);
    expect(g.phaseImmuneRemain).toBeUndefined();
    expect(isPhaseImmune(g)).toBe(false);
  });

  it("undefined はそのまま (no-op)", () => {
    const g = makeStubState();
    updatePhaseImmunity(g);
    expect(g.phaseImmuneRemain).toBeUndefined();
  });
});
