import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { GameState } from "@/game/state/GameState";
import { spawnChipBurst, updateChipParticles } from "@/game/effects/chipParticles";
import { FX_LIMITS } from "@/game/effects/fxConfig";

function makeStubState(extras: Partial<GameState> = {}): GameState {
  return {
    chipParticles: [],
    phaseTransition: undefined,
    ...extras,
  } as unknown as GameState;
}

describe("spawnChipBurst — basic spawn", () => {
  it("count 個のパーティクルを spawn する", () => {
    const g = makeStubState();
    spawnChipBurst(g, 100, 100, "to-player", 4);
    expect(g.chipParticles).toHaveLength(4);
  });

  it("kind=to-player は targetX が左寄り (プレイヤー HUD 側)", () => {
    const g = makeStubState();
    spawnChipBurst(g, 240, 360, "to-player", 1);
    const p = g.chipParticles![0];
    // CANVAS_W=480 → PLAYER_HUD_TARGET_X = 70 + (480-90)*0.2 = 70 + 78 = 148
    expect(p.targetX).toBeCloseTo(148, 0);
  });

  it("kind=to-boss は targetX が右寄り (ボス HUD 側)", () => {
    const g = makeStubState();
    spawnChipBurst(g, 240, 360, "to-boss", 1);
    const p = g.chipParticles![0];
    // BOSS_HUD_TARGET_X = 70 + (480-90)*0.8 = 70 + 312 = 382
    expect(p.targetX).toBeCloseTo(382, 0);
  });

  it("色を上書きできる", () => {
    const g = makeStubState();
    spawnChipBurst(g, 0, 0, "to-player", 2, "#ff00ff");
    expect(g.chipParticles![0].color).toBe("#ff00ff");
    expect(g.chipParticles![1].color).toBe("#ff00ff");
  });
});

describe("spawnChipBurst — 上限制御", () => {
  it("通常時は normalMax (40) を超えない", () => {
    const g = makeStubState();
    for (let i = 0; i < 60; i++) {
      spawnChipBurst(g, 0, 0, "to-player", 1);
    }
    expect(g.chipParticles!.length).toBeLessThanOrEqual(FX_LIMITS.chipParticlesNormalMax);
  });

  it("phaseTransition 中は transitionMax (80) まで保持", () => {
    const g = makeStubState({
      phaseTransition: { kind: "EVEN_STACK", life: 60, maxLife: 60 },
    });
    for (let i = 0; i < 100; i++) {
      spawnChipBurst(g, 0, 0, "to-player", 1);
    }
    expect(g.chipParticles!.length).toBeLessThanOrEqual(FX_LIMITS.chipParticlesTransitionMax);
    expect(g.chipParticles!.length).toBeGreaterThan(FX_LIMITS.chipParticlesNormalMax);
  });
});

describe("spawnChipBurst — lazy init", () => {
  it("chipParticles 未初期化でも spawn できる", () => {
    const g = { phaseTransition: undefined } as unknown as GameState;
    spawnChipBurst(g, 0, 0, "to-player", 3);
    expect(g.chipParticles).toBeDefined();
    expect(g.chipParticles).toHaveLength(3);
  });
});

describe("updateChipParticles — life decay + 到達消滅", () => {
  it("life=0 で削除", () => {
    const g = makeStubState();
    spawnChipBurst(g, 0, 0, "to-player", 1);
    g.chipParticles![0].life = 1;
    updateChipParticles(g);
    expect(g.chipParticles).toHaveLength(0);
  });

  it("ターゲット近接 (距離 < 12) で消滅", () => {
    const g = makeStubState();
    spawnChipBurst(g, 0, 0, "to-player", 1);
    const p = g.chipParticles![0];
    // ターゲット位置から +5px 以内に強制配置
    p.x = p.targetX + 3;
    p.y = p.targetY + 3;
    p.vy = 0;
    updateChipParticles(g);
    expect(g.chipParticles).toHaveLength(0);
  });

  it("非到達かつ life > 0 は維持される", () => {
    const g = makeStubState();
    spawnChipBurst(g, 400, 400, "to-player", 1);
    const initialLife = g.chipParticles![0].life;
    updateChipParticles(g);
    if (g.chipParticles!.length > 0) {
      expect(g.chipParticles![0].life).toBe(initialLife - 1);
    }
  });

  it("空配列でもクラッシュしない", () => {
    const g = makeStubState();
    expect(() => updateChipParticles(g)).not.toThrow();
  });

  it("undefined chipParticles でもクラッシュしない", () => {
    const g = { phaseTransition: undefined } as unknown as GameState;
    expect(() => updateChipParticles(g)).not.toThrow();
  });
});
