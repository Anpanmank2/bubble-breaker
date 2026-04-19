import { describe, it, expect } from "vitest";
import type { Boss, BossAccessoryState, BossFaceState } from "@/game/state/GameState";
import { drawChipLeader } from "@/game/boss/chipLeaderFx";

// node 環境で CanvasRenderingContext2D を持たないため、最低限のメソッドをスタブ化
function makeStubCtx(): CanvasRenderingContext2D {
  const calls: string[] = [];
  const handler = {
    get(target: Record<string, unknown>, prop: string | symbol): unknown {
      if (typeof prop === "symbol") return undefined;
      if (prop === "__calls") return calls;
      if (prop in target) return target[prop];
      return (..._args: unknown[]) => {
        calls.push(String(prop));
        if (prop === "createRadialGradient") {
          return {
            addColorStop: () => calls.push("addColorStop"),
          };
        }
      };
    },
    set(target: Record<string, unknown>, prop: string | symbol, value: unknown): boolean {
      if (typeof prop === "symbol") return true;
      target[prop] = value;
      return true;
    },
  };
  return new Proxy({}, handler) as unknown as CanvasRenderingContext2D;
}

function makeBoss(overrides: Partial<Boss> = {}): Boss {
  return {
    x: 100, y: 100, w: 50, h: 50,
    hp: 1200, maxHp: 1200,
    shootTimer: 0, sinOffset: 0,
    chipLeaderPhase: 1,
    faceState: "calm" as BossFaceState,
    accessoryState: "intact" as BossAccessoryState,
    sunglassesY: 0, sunglassesRotation: 0, sunglassesAlpha: 1,
    ...overrides,
  };
}

describe("drawChipLeader — 11 レイヤー描画", () => {
  it("Phase 1 (intact) 描画時にクラッシュしない", () => {
    const ctx = makeStubCtx();
    const boss = makeBoss({ accessoryState: "intact", faceState: "calm" });
    expect(() => drawChipLeader(ctx, boss, 0)).not.toThrow();
  });

  it("Phase 2 (cracked) 描画時にクラッシュしない", () => {
    const ctx = makeStubCtx();
    const boss = makeBoss({ accessoryState: "cracked", faceState: "sweat" });
    expect(() => drawChipLeader(ctx, boss, 30)).not.toThrow();
  });

  it("Phase 3 (broken) 描画時にクラッシュしない", () => {
    const ctx = makeStubCtx();
    const boss = makeBoss({ accessoryState: "broken", faceState: "panic" });
    expect(() => drawChipLeader(ctx, boss, 100)).not.toThrow();
  });

  it("サングラス吹っ飛び中 (sunglassesAlpha=0.5) でもクラッシュしない", () => {
    const ctx = makeStubCtx();
    const boss = makeBoss({
      accessoryState: "broken",
      faceState: "panic",
      sunglassesY: 30,
      sunglassesRotation: 1.5,
      sunglassesAlpha: 0.5,
    });
    expect(() => drawChipLeader(ctx, boss, 60)).not.toThrow();
  });

  it("サングラス完全消失 (alpha=0) でも描画スキップで OK", () => {
    const ctx = makeStubCtx();
    const boss = makeBoss({
      accessoryState: "broken",
      sunglassesAlpha: 0,
    });
    expect(() => drawChipLeader(ctx, boss, 60)).not.toThrow();
  });

  it("オプショナルフィールド未定義でもクラッシュしない (defensive)", () => {
    const ctx = makeStubCtx();
    const minimalBoss: Boss = {
      x: 100, y: 100, w: 50, h: 50,
      hp: 100, maxHp: 100, shootTimer: 0, sinOffset: 0,
    };
    expect(() => drawChipLeader(ctx, minimalBoss, 0)).not.toThrow();
  });
});

describe("drawChipLeader — state-driven 差分 (呼び出し回数ベース)", () => {
  it("Phase 3 は Phase 1 より多くの描画コールを発行する (汗+亀裂追加)", () => {
    const getCalls = (ctx: CanvasRenderingContext2D): string[] =>
      (ctx as unknown as { __calls: string[] }).__calls;

    const ctx1 = makeStubCtx();
    const ctx3 = makeStubCtx();
    drawChipLeader(ctx1, makeBoss({ accessoryState: "intact", faceState: "calm" }), 0);
    drawChipLeader(ctx3, makeBoss({ accessoryState: "broken", faceState: "panic" }), 0);
    // Phase 3 には banner の亀裂 zigzag (stroke + moveTo*) と 2 滴汗が追加されるので call 数が多い
    expect(getCalls(ctx3).length).toBeGreaterThan(getCalls(ctx1).length);
  });
});
