"use client";

type Props = { onEntry: () => void };

export function TitleScreen({ onEntry }: Props) {
  return (
    <div className="screen title-screen">
      <div className="tagline">JOPT GAME ARCADE</div>
      <h1 className="title-text">BUBBLE BREAKER</h1>
      <div className="subtitle">— バブルを越えろ —</div>
      <div className="story">
        トーナメント基礎からファイナルテーブルへ<br />
        カードを集めてハンドを作る<br />
        ロイヤルストレートフラッシュで即優勝
      </div>
      <button className="btn btn-cyan" onClick={onEntry} data-testid="btn-entry">
        ENTRY
      </button>
      <div className="hint">タップ / マウスで操作 ・ 弾は自動発射</div>
    </div>
  );
}
