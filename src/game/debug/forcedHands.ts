import { Card } from "../hand/constants";

// v2 (2026-04-18): 5 ランク化で StraightFlush = RoyalFlush / Flush = RoyalFlush と等価
// `straightflush` / `flush` forced key を廃止（Owner 決定）。既存 URL は `royal` に統合
export type ForcedHandKey = "royal" | "four" | "fullhouse" | "straight" | null;

export function readForcedHand(search: string): ForcedHandKey {
  const params = new URLSearchParams(search);
  const v = params.get("test");
  if (!v) return null;
  // v2: `straightflush` / `flush` の旧 URL を `royal` にフォールバック（運営台本互換用）
  if (v === "straightflush" || v === "flush") return "royal";
  const allowed: ForcedHandKey[] = ["royal", "four", "fullhouse", "straight"];
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
