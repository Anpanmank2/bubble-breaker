"use client";

import { buildXIntent } from "@/lib/share/xIntent";
import { buildLineShare } from "@/lib/share/lineShare";

type Props = {
  text: string;
  onShare?: () => void;
};

export function ShareButtons({ text, onShare }: Props) {
  const gameUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_GAME_URL ?? "http://localhost:3000";

  const handleShare = (href: string) => {
    try {
      void fetch("/api/share", { method: "POST" });
    } catch {
      /* noop */
    }
    if (onShare) onShare();
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="share-buttons">
      <button
        className="btn btn-x"
        onClick={() => handleShare(buildXIntent(text, gameUrl))}
        data-testid="btn-share-x"
      >
        X でシェア
      </button>
      <button
        className="btn btn-line"
        onClick={() => handleShare(buildLineShare(`${text} ${gameUrl}`))}
        data-testid="btn-share-line"
      >
        LINE でシェア
      </button>
    </div>
  );
}
