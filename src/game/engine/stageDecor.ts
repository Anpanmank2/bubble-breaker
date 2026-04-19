// stageDecor.ts — 縦画面 (480×720) 用ステージ別背景装飾
// 藤井 蓮 (eng-05) Art Direction — Sprint 3 Track A Phase 2
//
// CANVAS: W=480, H=720
// プレイ空間: y=60-640 (HUD上部 y=0-60、HUD下部 y=640-720)
// Boss 占有: x=180-300, y=90-230 (中央上部)
// Player 占有: y=600-640 付近 (下部)
// 安全エリア (装飾のみ): 左端 x=0-50、右端 x=430-480、上端 y=60-120、下端 y=580-640
//
// 各 Stage で draw call は 10-15 回以内。毎フレーム呼び出し OK レベル。
// frameCount は呼び出し元から渡す (アニメーション制御用)

const CANVAS_W = 480;
const CANVAS_H = 720;

// ───────────────────────────────────────────────
// Public export — Renderer.ts から呼び出す
// ───────────────────────────────────────────────

/**
 * 縦画面用ステージ別背景装飾
 * @param ctx    Canvas 2D コンテキスト
 * @param stageNum  1-4
 * @param stageTimer フレームカウンタ (アニメーション用、旧 t)
 * @param frameCount グローバルフレームカウンタ (stageTimer と同一でも可)
 */
export function drawStageDecorVertical(
  ctx: CanvasRenderingContext2D,
  stageNum: number,
  stageTimer: number,
  frameCount: number,
): void {
  ctx.save();
  ctx.globalAlpha = 1;

  switch (stageNum) {
    case 1: drawStage1(ctx, frameCount); break;
    case 2: drawStage2(ctx, stageTimer, frameCount); break;
    case 3: drawStage3(ctx, stageTimer, frameCount); break;
    case 4: drawStage4(ctx, frameCount); break;
  }

  ctx.restore();
}

// ───────────────────────────────────────────────
// Stage 1: EARLY LEVEL — バー雰囲気 (#1a472a 深緑)
// 左上角: ビールジョッキ小 (30×40)
// 右上角: ビールジョッキ小 (30×40)
// 左下角: チップ山小
// 右下角: チップ山小
// draw call 計: ~14
// ───────────────────────────────────────────────
function drawStage1(ctx: CanvasRenderingContext2D, frame: number): void {
  // 左上ジョッキ (x=4, y=62)
  drawBeerMug(ctx, 4, 62);
  // 右上ジョッキ (x=446, y=62) — 右端 480 から逆算: 30px 幅なので x=446
  drawBeerMug(ctx, 446, 62);

  // 左下チップ山 (x=4, y=574) — 下部 HUD が y=640~ なので y=574 で余裕
  drawChipStack(ctx, 4, 574, frame);
  // 右下チップ山 (x=446, y=574)
  drawChipStack(ctx, 446, 574, frame);
}

/** ビールジョッキ: 30w × 40h、左上起点 */
function drawBeerMug(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // ジョッキ本体 (麦色)
  ctx.fillStyle = "#c8860a";
  ctx.fillRect(x + 4, y + 10, 22, 28);

  // ビール (アンバー)
  ctx.fillStyle = "#e09010";
  ctx.fillRect(x + 5, y + 14, 20, 22);

  // 泡 (白、上部 6px)
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(x + 4, y + 10, 22, 7);
  // 泡のぷつぷつ (小さい円 3 粒)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(x + 10, y + 12, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 16, y + 13, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 22, y + 11, 2, 0, Math.PI * 2); ctx.fill();

  // ハンドル
  ctx.strokeStyle = "#8b6010";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 30, y + 20, 8, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // ジョッキ縁
  ctx.strokeStyle = "#6b4a08";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 4, y + 10, 22, 28);
}

/** チップ山: 3 枚積み、左上起点 30×30 相当 */
function drawChipStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
): void {
  // わずかに浮遊 (±1px sin)
  const floatY = Math.sin(frame * 0.04) * 1;

  const chips = [
    { col: "#e63946", rim: "#8b0000", label: "$25" },  // 赤
    { col: "#4caf50", rim: "#2e7d32", label: "$100" }, // 緑
    { col: "#f5f5f5", rim: "#9e9e9e", label: "$5" },  // 白
  ];

  chips.forEach((chip, i) => {
    const cy = y + floatY - i * 5;
    // 楕円チップ (横長で奥行き感)
    ctx.fillStyle = chip.col;
    ctx.beginPath();
    ctx.ellipse(x + 15, cy + 12, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = chip.rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + 15, cy + 12, 13, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

// ───────────────────────────────────────────────
// Stage 2: MIDDLE LEVEL — トーナメントフロア (#1a3a2a 深緑)
// 中央下 (y=420-450): ビッグブラインド表示 (半透明)
// 左右端: 落下カード演出 (y=60-580 範囲)
// draw call 計: ~12
// ───────────────────────────────────────────────
function drawStage2(
  ctx: CanvasRenderingContext2D,
  t: number,
  frame: number,
): void {
  // ビッグブラインド表示 (画面中央下、半透明)
  drawBigBlindLabel(ctx);

  // 左端落下カード (x=0-24 範囲)
  drawFallingCard(ctx, 12, frame, 0);
  drawFallingCard(ctx, 24, frame, 60); // オフセット差で交互に落ちる

  // 右端落下カード (x=456-480 範囲)
  drawFallingCard(ctx, 468, frame, 30);
  drawFallingCard(ctx, 456, frame, 90);
}

function drawBigBlindLabel(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$1,000 BB", CANVAS_W / 2, 430);
  ctx.font = "bold 13px monospace";
  ctx.fillStyle = "#e8e8e8";
  ctx.fillText("$500 SB", CANVAS_W / 2, 452);
  ctx.restore();
}

/**
 * 落下カード演出
 * @param cx 中心 X
 * @param frame グローバルフレーム
 * @param phaseOffset フレームオフセット (カードごとにずらす)
 */
function drawFallingCard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  frame: number,
  phaseOffset: number,
): void {
  // 520 フレームで 1 サイクル (y=60 → y=580 を循環)
  const cycle = 520;
  const rawY = ((frame + phaseOffset) % cycle) / cycle; // 0.0 → 1.0
  const cardY = 60 + rawY * 520;

  // プレイ空間外 (上端 60 以下、下端 580 以上) は描画しない
  if (cardY < 60 || cardY > 580) return;

  // カードサイズ (小さめ 14×18)
  const cw = 14;
  const ch = 18;
  const suits = ["♠", "♥", "♦", "♣"];
  const suitIdx = Math.floor((frame + phaseOffset) / cycle) % 4;
  const suit = suits[suitIdx];
  const isRed = suit === "♥" || suit === "♦";

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - cw / 2, cardY - ch / 2, cw, ch);
  ctx.strokeStyle = "#4ecdc4";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - cw / 2, cardY - ch / 2, cw, ch);
  ctx.fillStyle = isRed ? "#e63946" : "#1a1a2e";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(suit, cx, cardY);
  ctx.restore();
}

// ───────────────────────────────────────────────
// Stage 3: BUBBLE LINE — 緊張感 (#2a1a1a 暗赤)
// 赤い点滅水平ライン (y=420)
// 右端縦書き "BUBBLE" ロゴ
// draw call 計: ~10
// ───────────────────────────────────────────────
function drawStage3(
  ctx: CanvasRenderingContext2D,
  t: number,
  frame: number,
): void {
  // 点滅ライン (60 フレーム周期、alpha 0.25-0.55)
  drawBubbleLine(ctx, frame);

  // 右端縦書き BUBBLE ロゴ (x=460-480、y=160-380)
  drawBubbleVerticalText(ctx);
}

function drawBubbleLine(ctx: CanvasRenderingContext2D, frame: number): void {
  // sin で滑らかに点滅 (alpha 0.25 → 0.55)
  const alpha = 0.25 + 0.15 * Math.sin(frame * 0.08);
  const lineY = 420;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ff2222";
  ctx.lineWidth = 2;
  // 破線で「越えてはならない境界線」感
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, lineY);
  ctx.lineTo(CANVAS_W, lineY);
  ctx.stroke();
  ctx.setLineDash([]);

  // ライン上に「BUBBLE」テキスト (左端)
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = "#ff4444";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("BUBBLE", 6, lineY - 2);
  ctx.restore();
}

function drawBubbleVerticalText(ctx: CanvasRenderingContext2D): void {
  const letters = ["B", "U", "B", "B", "L", "E"];
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ff4444";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  letters.forEach((ch, i) => {
    ctx.fillText(ch, CANVAS_W - 8, 170 + i * 22);
  });
  ctx.restore();
}

// ───────────────────────────────────────────────
// Stage 4: FINAL TABLE — VIP 豪華感 (#0a0a1a 深紺)
// 四隅: ゴールド装飾枠 (30×30)
// 上端中央: シャンデリア (radialGradient)
// draw call 計: ~13
// ───────────────────────────────────────────────
function drawStage4(ctx: CanvasRenderingContext2D, frame: number): void {
  // シャンデリア (上端中央、プレイ空間の外 y<90 に収まる)
  drawChandelier(ctx, frame);

  // 四隅ゴールド装飾枠
  drawGoldCorner(ctx, 0,            60,           false, false); // 左上
  drawGoldCorner(ctx, CANVAS_W - 30, 60,           true,  false); // 右上
  drawGoldCorner(ctx, 0,            CANVAS_H - 90, false, true);  // 左下
  drawGoldCorner(ctx, CANVAS_W - 30, CANVAS_H - 90, true,  true);  // 右下
}

function drawChandelier(ctx: CanvasRenderingContext2D, frame: number): void {
  const cx = CANVAS_W / 2;
  const cy = 72; // HUD 下端 y=60 の直下、Boss y=90 の上
  // 呼吸する光 (半径 24-28 でゆらゆら)
  const r = 24 + 3 * Math.sin(frame * 0.05);

  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
  grad.addColorStop(0, "rgba(255, 220, 80, 0.28)");
  grad.addColorStop(0.5, "rgba(255, 190, 40, 0.10)");
  grad.addColorStop(1, "rgba(255, 160, 0, 0)");

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 中心の光点
  ctx.fillStyle = "rgba(255, 240, 140, 0.55)";
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // シャンデリアの垂れ飾り (4本の短い線)
  ctx.strokeStyle = "rgba(255, 215, 0, 0.30)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 5, cy + Math.sin(angle) * 5);
    ctx.lineTo(cx + Math.cos(angle) * 14, cy + Math.sin(angle) * 14);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * ゴールド装飾枠 (30×30) — 角の L 字フレーム
 * @param x, y 左上起点
 * @param flipX 右端の場合 true (X 反転)
 * @param flipY 下端の場合 true (Y 反転)
 */
function drawGoldCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: boolean,
  flipY: boolean,
): void {
  const size = 30;
  const arm = 10; // L字の腕の長さ
  const thickness = 2.5;

  // ゴールドグラデーション (線に適用するためにシンプルな solid を使用)
  ctx.save();
  ctx.globalAlpha = 0.45;

  // 外枠グロー
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 4;
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";

  // 座標変換で flip
  const sx = flipX ? x + size : x;
  const sy = flipY ? y + size : y;
  const dx = flipX ? -1 : 1;
  const dy = flipY ? -1 : 1;

  // 上辺
  ctx.beginPath();
  ctx.moveTo(sx + dx * arm, sy);
  ctx.lineTo(sx, sy);
  ctx.lineTo(sx, sy + dy * arm);
  ctx.stroke();

  // 内側アクセント (細線)
  ctx.strokeStyle = "rgba(255, 240, 100, 0.6)";
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(sx + dx * (arm - 4), sy + dy * 3);
  ctx.lineTo(sx + dx * 3, sy + dy * 3);
  ctx.lineTo(sx + dx * 3, sy + dy * (arm - 4));
  ctx.stroke();

  ctx.restore();
}
