import { describe, it, expect } from "vitest";
import { getRealtimePower } from "@/game/hand/getRealtimePower";
import { Card } from "@/game/hand/constants";

const c = (rank: string, suit: string): Card => ({ rank: rank as Card["rank"], suit: suit as Card["suit"] });

describe("getRealtimePower — labels", () => {
  it("0枚 = base", () => {
    expect(getRealtimePower([]).label).toBe("");
  });

  it("PAIR (A x2)", () => {
    const p = getRealtimePower([c("A", "♠"), c("A", "♥")]);
    expect(p.label).toContain("PAIR!");
    expect(p.extra).toBe(0);
  });

  it("TWO PAIR (A x2 + K x2)", () => {
    const p = getRealtimePower([c("A", "♠"), c("A", "♥"), c("K", "♦"), c("K", "♣")]);
    expect(p.label).toContain("TWO PAIR!");
    expect(p.extra).toBe(1);
  });

  it("TRIPS (A x3)", () => {
    const p = getRealtimePower([c("A", "♠"), c("A", "♥"), c("A", "♦")]);
    expect(p.label).toContain("TRIPS!");
    expect(p.extra).toBe(1);
  });

  it("FULL HOUSE (A x3 + K x2)", () => {
    const p = getRealtimePower([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("K", "♣"), c("K", "♠")]);
    expect(p.label).toContain("FULL HOUSE!");
    expect(p.extra).toBe(2);
  });

  it("FOUR (A x4)", () => {
    const p = getRealtimePower([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("A", "♣")]);
    expect(p.label).toContain("FOUR!");
    expect(p.extra).toBe(2);
  });

  it("+FLUSH DRAW (4+ same suit)", () => {
    const p = getRealtimePower([c("T", "♠"), c("J", "♠"), c("Q", "♠"), c("K", "♠")]);
    expect(p.label).toContain("+FLUSH DRAW");
  });
});
