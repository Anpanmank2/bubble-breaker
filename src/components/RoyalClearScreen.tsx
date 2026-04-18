"use client";

import { Card } from "@/game/hand/constants";
import { ShareButtons } from "./ShareButtons";
import { LStepCouponPanel } from "./LStepCouponPanel";

type Props = {
  cards: Card[];
  stageNum: number;
  onPlayAgain: () => void;
  runId: string;
  endedStage: 1 | 2 | 3 | 4;
};

export function RoyalClearScreen({ cards, stageNum, onPlayAgain, runId, endedStage }: Props) {
  return (
    <div className="screen royal-clear-screen" data-testid="royal-clear">
      <div className="royal-diamonds">♦ ♦ ♦</div>
      <div className="royal-title">ROYAL STRAIGHT FLUSH</div>
      <div className="perfect-champion">🌈 PERFECT CHAMPION</div>
      <div className="cards-row">
        {cards.map((c, i) => (
          <div key={i} className="card-face royal-card">
            <div className={`card-rank ${c.suit === "♥" || c.suit === "♦" ? "red" : "black"}`}>{c.rank}</div>
            <div className={`card-suit ${c.suit === "♥" || c.suit === "♦" ? "red" : "black"}`}>{c.suit}</div>
          </div>
        ))}
      </div>
      <div className="royal-stage">Stage {stageNum} でロイヤルストレートフラッシュ達成</div>
      <LStepCouponPanel
        runId={runId}
        endedStage={endedStage}
        endedReason="royal"
        bestHand="ROYAL_FLUSH"
        score={99999}
      />
      <ShareButtons text={`BUBBLE BREAKER でロイヤル発火、Stage ${stageNum} 即優勝 🌈 #JOPTGameArcade`} />
      <button className="btn btn-magenta" onClick={onPlayAgain}>
        PLAY AGAIN
      </button>
    </div>
  );
}
