import { Card } from "../hand/constants";

export type ForcedHandKey = "royal" | "straightflush" | "four" | "fullhouse" | "flush" | "straight" | null;

export function readForcedHand(search: string): ForcedHandKey {
  const params = new URLSearchParams(search);
  const v = params.get("test");
  if (!v) return null;
  const allowed: ForcedHandKey[] = ["royal", "straightflush", "four", "fullhouse", "flush", "straight"];
  return allowed.includes(v as ForcedHandKey) ? (v as ForcedHandKey) : null;
}

export function readForcedStage(search: string): number | null {
  const params = new URLSearchParams(search);
  const s = params.get("stage");
  if (!s) return null;
  const n = parseInt(s, 10);
  if (isNaN(n) || n < 1 || n > 4) return null;
  return n;
}

export function readDebugFlag(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get("debug") === "1";
}

export function readQuickFlag(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get("quick") === "1";
}

export function buildForcedHand(key: ForcedHandKey): Card[] | null {
  if (!key) return null;
  switch (key) {
    case "royal":
      return [
        { rank: "T", suit: "♠" },
        { rank: "J", suit: "♠" },
        { rank: "Q", suit: "♠" },
        { rank: "K", suit: "♠" },
        { rank: "A", suit: "♠" },
      ];
    case "straightflush":
      return [
        { rank: "8", suit: "♥" },
        { rank: "9", suit: "♥" },
        { rank: "T", suit: "♥" },
        { rank: "J", suit: "♥" },
        { rank: "Q", suit: "♥" },
      ];
    case "four":
      return [
        { rank: "A", suit: "♠" },
        { rank: "A", suit: "♥" },
        { rank: "A", suit: "♦" },
        { rank: "A", suit: "♣" },
        { rank: "K", suit: "♠" },
      ];
    case "fullhouse":
      return [
        { rank: "A", suit: "♠" },
        { rank: "A", suit: "♥" },
        { rank: "A", suit: "♦" },
        { rank: "K", suit: "♣" },
        { rank: "K", suit: "♠" },
      ];
    case "flush":
      return [
        { rank: "8", suit: "♠" },
        { rank: "T", suit: "♠" },
        { rank: "Q", suit: "♠" },
        { rank: "K", suit: "♠" },
        { rank: "A", suit: "♠" },
      ];
    case "straight":
      return [
        { rank: "T", suit: "♠" },
        { rank: "J", suit: "♥" },
        { rank: "Q", suit: "♦" },
        { rank: "K", suit: "♣" },
        { rank: "A", suit: "♠" },
      ];
    default:
      return null;
  }
}
