import { describe, it, expect } from "vitest";
import { totalCardValue } from "@/game/hand/totalCardValue";
import { Card } from "@/game/hand/constants";

const c = (rank: string, suit: string): Card => ({ rank: rank as Card["rank"], suit: suit as Card["suit"] });

describe("totalCardValue — spec §10.4 attack formula foundation", () => {
  it("empty returns 0", () => {
    expect(totalCardValue([])).toBe(0);
  });

  it("AAAA K = 16*4 + 15 = 79", () => {
    const v = totalCardValue([c("A", "♠"), c("A", "♥"), c("A", "♦"), c("A", "♣"), c("K", "♠")]);
    expect(v).toBe(79);
  });

  it("T J Q K A = 12+13+14+15+16 = 70", () => {
    const v = totalCardValue([c("T", "♠"), c("J", "♥"), c("Q", "♦"), c("K", "♣"), c("A", "♠")]);
    expect(v).toBe(70);
  });

  it("T J = 12 + 13 = 25", () => {
    expect(totalCardValue([c("T", "♠"), c("J", "♥")])).toBe(25);
  });

  it("single A = 16", () => {
    expect(totalCardValue([c("A", "♠")])).toBe(16);
  });
});
