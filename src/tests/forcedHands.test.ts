import { describe, it, expect } from "vitest";
import {
  readForcedHand, readForcedStage, readDebugFlag, readQuickFlag, buildForcedHand,
} from "@/game/debug/forcedHands";
import { evaluateHand } from "@/game/hand/evaluateHand";

describe("readForcedHand", () => {
  it("returns the matching key", () => {
    expect(readForcedHand("?test=royal")).toBe("royal");
    expect(readForcedHand("?test=four")).toBe("four");
    expect(readForcedHand("?test=fullhouse")).toBe("fullhouse");
    expect(readForcedHand("?test=straight")).toBe("straight");
  });
  it("returns null for unknown or missing", () => {
    expect(readForcedHand("")).toBeNull();
    expect(readForcedHand("?test=bogus")).toBeNull();
  });
  it("v2 migration: straightflush / flush fallback to royal", () => {
    // 5 ランク環境では SF = RF なので旧 URL を royal に統合
    expect(readForcedHand("?test=straightflush")).toBe("royal");
    expect(readForcedHand("?test=flush")).toBe("royal");
  });
});

describe("readForcedStage — boundary", () => {
  it("accepts 1..4", () => {
    expect(readForcedStage("?stage=1")).toBe(1);
    expect(readForcedStage("?stage=4")).toBe(4);
  });
  it("rejects 0, 5, non-numeric, empty", () => {
    expect(readForcedStage("?stage=0")).toBeNull();
    expect(readForcedStage("?stage=5")).toBeNull();
    expect(readForcedStage("?stage=abc")).toBeNull();
    expect(readForcedStage("")).toBeNull();
  });
});

describe("readDebugFlag / readQuickFlag", () => {
  it("debug=1", () => {
    expect(readDebugFlag("?debug=1")).toBe(true);
    expect(readDebugFlag("?debug=0")).toBe(false);
    expect(readDebugFlag("")).toBe(false);
  });
  it("quick=1", () => {
    expect(readQuickFlag("?quick=1")).toBe(true);
    expect(readQuickFlag("")).toBe(false);
  });
});

describe("buildForcedHand produces hands that match expected evaluation", () => {
  it("royal → ROYAL_FLUSH", () => {
    const h = buildForcedHand("royal")!;
    expect(evaluateHand(h).name).toBe("ROYAL_FLUSH");
  });
  it("four → FOUR_KIND", () => {
    const h = buildForcedHand("four")!;
    expect(evaluateHand(h).name).toBe("FOUR_KIND");
  });
  it("fullhouse → FULL_HOUSE", () => {
    const h = buildForcedHand("fullhouse")!;
    expect(evaluateHand(h).name).toBe("FULL_HOUSE");
  });
  it("straight → STRAIGHT", () => {
    const h = buildForcedHand("straight")!;
    expect(evaluateHand(h).name).toBe("STRAIGHT");
  });
});
