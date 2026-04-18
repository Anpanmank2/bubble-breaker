"use client";

import { Card } from "@/game/hand/constants";

type Props = {
  stageNum: number;
  cards: Card[];
  handName: string;
  handColor: string;
  mult: number;
  value: number;
  power: number;
  onFight: () => void;
};

export function HandRevealScreen({ stageNum, cards, handName, handColor, mult, value, power, onFight }: Props) {
  return (
    <div className="screen hand-reveal-screen">
      <div className="stage-label">STAGE {stageNum} — SHOWDOWN</div>
      <div className="cards-row">
        {cards.map((c, i) => (
          <div
            key={i}
            className="card-face live"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className={`card-rank ${c.suit === "♥" || c.suit === "♦" ? "red" : "black"}`}>{c.rank}</div>
            <div className={`card-suit ${c.suit === "♥" || c.suit === "♦" ? "red" : "black"}`}>{c.suit}</div>
          </div>
        ))}
      </div>
      <div className="hand-name" style={{ color: handColor }}>{handName}</div>
      <div className="hand-detail">
        単体値: {value} × 倍率: {mult} = <span className="hand-power">攻撃力 {power}</span>
      </div>
      <div className="hand-bar">
        <div
          className="hand-bar-fill"
          style={{ width: `${Math.min(100, power / 4)}%`, background: handColor }}
        />
      </div>
      <button className="btn btn-gold" onClick={onFight} data-testid="btn-fight-boss">
        FIGHT BOSS →
      </button>
    </div>
  );
}
