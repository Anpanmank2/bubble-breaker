"use client";

import { ShareButtons } from "./ShareButtons";
import { LStepCouponPanel } from "./LStepCouponPanel";

type Props = {
  score: number;
  onPlayAgain: () => void;
  runId: string;
  bestHand: string;
};

export function ClearScreen({ score, onPlayAgain, runId, bestHand }: Props) {
  return (
    <div className="screen clear-screen">
      <div className="champion-title">🏆 CHAMPION</div>
      <div className="champion-sub">おめでとうございます、あなたがチャンピオンです</div>
      <div className="stats-box gold-border">
        Finished: 1st / 247 entries<br />
        Score: {score.toLocaleString()}
      </div>
      <LStepCouponPanel
        runId={runId}
        endedStage={4}
        endedReason="cleared"
        bestHand={bestHand}
        score={score}
      />
      <ShareButtons text={`BUBBLE BREAKER 優勝しました！ #JOPTGameArcade`} />
      <button className="btn btn-gold" onClick={onPlayAgain}>
        PLAY AGAIN
      </button>
    </div>
  );
}
