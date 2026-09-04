# BUBBLE BREAKER

「BUBBLE BREAKER — JOPT Game Arcade」として公開しているブラウザミニゲーム（Next.js製）。ボス戦付きのステージクリア型で、クリア時にクーポン発行APIと連携する。

## スタック
- Next.js 16.2.4 / React 19.2.4 / TypeScript / Tailwind v4
- Vercel KV
- Vitest（unit）+ Playwright（e2e）

## 主要ディレクトリ
| パス | 役割 |
|---|---|
| `src/game/engine/` | ゲームループ・描画エンジン |
| `src/game/stages/` | ステージ構成・敵ステータス |
| `src/game/boss/` | ボス演出・フェーズ制御 |
| `src/game/managers/` `src/game/state/` `src/game/effects/` `src/game/characters/` `src/game/hand/` | ゲームロジック各モジュール |
| `src/lib/kv/` | Vercel KV連携 |
| `src/lib/share/` | 結果シェア機能 |
| `src/app/api/coupons/issue/` | クリア時クーポン発行API |
| `src/app/api/share/` | シェアAPI |
| `qa/` | QA用ペルソナ自動プレイシミュレーション |
| `e2e/` | Playwright e2eテスト（2026-09-03時点 17本） |
| `src/tests/` | vitest ユニットテスト（2026-09-03時点 13本） |

## セットアップ

```bash
npm install
npm run dev
```

## テスト

```bash
npm test      # vitest run
npm run e2e   # playwright test
```

## デプロイ
Vercel。GitHub: Anpanmank2/bubble-breaker（**public**・2026-09-03時点 `gh repo view` 確認）。
