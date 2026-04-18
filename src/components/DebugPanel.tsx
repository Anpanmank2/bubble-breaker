"use client";

type Props = {
  screen: string;
  stageNum: number;
  lives: number;
  score: number;
  forcedKey: string | null;
  startStageNum: number;
  onSetStage: (sn: number) => void;
};

export function DebugPanel({ screen, stageNum, lives, score, forcedKey, startStageNum, onSetStage }: Props) {
  return (
    <div className="debug-panel" data-testid="debug-panel">
      <div><strong>DEBUG</strong></div>
      <div>screen: {screen}</div>
      <div>stage: {stageNum}</div>
      <div>lives: {lives}</div>
      <div>score: {score}</div>
      <div>forced: {forcedKey ?? "—"}</div>
      <div>start stage: {startStageNum}</div>
      <div className="debug-btn-row">
        {[1, 2, 3, 4].map((n) => (
          <button key={n} onClick={() => onSetStage(n)}>st{n}</button>
        ))}
      </div>
    </div>
  );
}
