import { describe, it, expect } from "vitest";
import { ENEMY_DIALOG_LINES } from "@/game/characters/constants";
import { __test__ } from "@/game/managers/EnemyManager";
import type { EnemyType } from "@/game/stages/enemyStats";

const { pickDialog, DIALOG_LIFE_FRAMES } = __test__;

describe("ENEMY_DIALOG_LINES — 9 種カバレッジ", () => {
  const expectedTypes: EnemyType[] = [
    "limp", "gaba", "donk",
    "tag", "callstation", "threebetter",
    "gto", "bluffcatch", "slowplay",
  ];

  it("9 種すべてのタイプにセリフが定義されている", () => {
    for (const type of expectedTypes) {
      expect(ENEMY_DIALOG_LINES[type]).toBeDefined();
      expect(ENEMY_DIALOG_LINES[type].length).toBeGreaterThan(0);
    }
  });

  it("セリフはすべて文字列", () => {
    for (const type of expectedTypes) {
      for (const line of ENEMY_DIALOG_LINES[type]) {
        expect(typeof line).toBe("string");
        expect(line.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("pickDialog — ランダム抽選", () => {
  it("定義済みタイプは必ず null でないセリフを返す", () => {
    for (const type of ["donk", "tag", "gto"] as EnemyType[]) {
      const line = pickDialog(type);
      expect(line).not.toBeNull();
      expect(ENEMY_DIALOG_LINES[type]).toContain(line);
    }
  });

  it("limp のセリフは「コールだけ」のみ (1 種)", () => {
    for (let i = 0; i < 10; i++) {
      expect(pickDialog("limp" as EnemyType)).toBe("コールだけ");
    }
  });

  it("donk は 2 種のうちどちらか", () => {
    const results = new Set<string | null>();
    for (let i = 0; i < 50; i++) {
      results.add(pickDialog("donk" as EnemyType));
    }
    expect(results.size).toBeGreaterThanOrEqual(1);
    for (const line of results) {
      expect(["72o オールイン！", "93s レイズ！"]).toContain(line);
    }
  });
});

describe("DIALOG_LIFE_FRAMES — 持続時間", () => {
  it("DIALOG_LIFE_FRAMES = 90 (1500ms @60fps)", () => {
    expect(DIALOG_LIFE_FRAMES).toBe(90);
  });
});
