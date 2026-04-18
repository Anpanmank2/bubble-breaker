import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BUBBLE BREAKER — JOPT Game Arcade",
  description: "バブルを越えろ。JOPT Grand Final 2026 第2弾ゲーム。",
  openGraph: {
    title: "BUBBLE BREAKER",
    description: "バブルを越えろ。4ステージ通しプレイ × ポーカーハンドで敵を殲滅。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body>{children}</body>
    </html>
  );
}
