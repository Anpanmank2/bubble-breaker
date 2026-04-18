"use client";

import { ShareButtons } from "./ShareButtons";

type Props = {
  deathMessage: string;
  stageName: string;
  placement: number;
  score: number;
  onRetry: () => void;
  runId: string;
  endedStage: 1 | 2 | 3 | 4;
};

export function GameOverScreen({ deathMessage, stageName, placement, score, onRetry }: Props) {
  return (
    <div className="screen game-over-screen">
      <div className="busted-title">💀 BUSTED</div>
      <div className="death-msg">{deathMessage}</div>
      <div className="stats-box">
        Finished: {placement}th / 247 entries<br />
        Stage: {stageName}<br />
        Score: {score.toLocaleString()}
      </div>
      <ShareButtons text={`BUBBLE BREAKER で ${placement}位 / 247人 に散りました #JOPTGameArcade`} />
      <button className="btn btn-cyan" onClick={onRetry} data-testid="btn-retry">
        RETRY
      </button>
    </div>
  );
}
