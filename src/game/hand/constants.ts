export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ["8", "9", "T", "J", "Q", "K", "A"] as const;
export type Rank = (typeof RANKS)[number];

export const RANK_VALUES: Record<Rank, number> = {
  "8": 10, "9": 11, "T": 12, "J": 13, "Q": 14, "K": 15, "A": 16,
};

export const RANK_ORDER: Record<Rank, number> = {
  "8": 0, "9": 1, "T": 2, "J": 3, "Q": 4, "K": 5, "A": 6,
};

export const SUIT_COLORS: Record<Suit, string> = {
  "♠": "#1a1a2e", "♥": "#e63946", "♦": "#e6b800", "♣": "#2d6a4f",
};

export type HandName =
  | "ROYAL_FLUSH"
  | "STRAIGHT_FLUSH"
  | "FOUR_KIND"
  | "FULL_HOUSE"
  | "FLUSH"
  | "STRAIGHT"
  | "THREE_KIND"
  | "TWO_PAIR"
  | "ONE_PAIR"
  | "HIGH_CARD";

export const HAND_NAMES: Record<HandName, string> = {
  ROYAL_FLUSH: "ROYAL STRAIGHT FLUSH",
  STRAIGHT_FLUSH: "STRAIGHT FLUSH",
  FOUR_KIND: "FOUR OF A KIND",
  FULL_HOUSE: "FULL HOUSE",
  FLUSH: "FLUSH",
  STRAIGHT: "STRAIGHT",
  THREE_KIND: "THREE OF A KIND",
  TWO_PAIR: "TWO PAIR",
  ONE_PAIR: "ONE PAIR",
  HIGH_CARD: "HIGH CARD",
};

export const HAND_MULTIPLIERS: Record<HandName, number> = {
  ROYAL_FLUSH: 99,
  STRAIGHT_FLUSH: 8.0,
  FOUR_KIND: 5.0,
  FULL_HOUSE: 4.0,
  FLUSH: 3.5,
  STRAIGHT: 3.0,
  THREE_KIND: 2.0,
  TWO_PAIR: 1.5,
  ONE_PAIR: 1.2,
  HIGH_CARD: 1.0,
};

export const HAND_COLORS: Record<HandName, string> = {
  ROYAL_FLUSH: "#ff00ff",
  STRAIGHT_FLUSH: "#ffd700",
  FOUR_KIND: "#ffa500",
  FULL_HOUSE: "#c0c0c0",
  FLUSH: "#00bfff",
  STRAIGHT: "#00ff88",
  THREE_KIND: "#aaaaaa",
  TWO_PAIR: "#888888",
  ONE_PAIR: "#666666",
  HIGH_CARD: "#444444",
};

export type Card = { rank: Rank; suit: Suit };
