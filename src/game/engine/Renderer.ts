import { GameState, CANVAS_W, CANVAS_H, CARD_SIZE, PLAYER_SIZE } from "../state/GameState";
import { getEnemyColor, getEnemyLabel } from "../stages/enemyStats";
import { evaluateHand } from "../hand/evaluateHand";
import { HAND_COLORS, HAND_NAMES } from "../hand/constants";
import { STACK_BAR_COLORS, PHASE_TRANSITION_TEXT, ONE_OUTER_TEXT } from "../characters/constants";
import { drawChipLeader } from "../boss/chipLeaderFx";
import { drawStageBoss } from "../boss/stageBossFx";
import { drawStageDecorVertical } from "./stageDecor";

export function render(g: GameState, ctx: CanvasRenderingContext2D, lives: number) {
  ctx.save();
  if (g.shakeDuration > 0) {
    const sx = (Math.random() - 0.5) * g.shakeIntensity;
    const sy = (Math.random() - 0.5) * g.shakeIntensity;
    ctx.translate(sx, sy);
  }

  // Background
  ctx.fillStyle = g.cfg.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Sprint 3 Track A Phase 2: 縦画面用背景装飾 (旧 drawStageDecor は rollback 用に定義のみ残存)
  drawStageDecorVertical(ctx, g.stageNum, g.stageTimer, g.stageTimer);

  // v2 縦画面化: Grid の Y 軸をスクロール (上から下へ背景が流れる印象)
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = -(g.scrollY % 40); y < CANVAS_H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  // Stage info
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`STAGE ${g.stageNum} - ${g.cfg.name}`, 10, 18);
  ctx.fillText(`BLIND ${g.cfg.blind}`, 10, 32);
  ctx.textAlign = "right";
  ctx.fillText(`REMAINING: ${g.cfg.remaining}`, CANVAS_W - 10, 18);

  // Lives
  ctx.textAlign = "left";
  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = "#ff4444";
    ctx.font = "14px monospace";
    ctx.fillText("♥", 10 + i * 18, 52);
  }

  // Phase indicator
  if (g.phase === "collect") {
    const progress = g.stageTimer / g.collectDuration;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(60, 42, 150, 8);
    ctx.fillStyle = progress > 0.8 ? "#ff6b6b" : "#4ecdc4";
    ctx.fillRect(60, 42, 150 * progress, 8);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "9px monospace";
    ctx.fillText("CARD COLLECT", 62, 40);
  }

  // Cards on field
  g.cards.forEach((c) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.globalAlpha = c.glow;
    ctx.shadowColor = "#4ecdc4";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#fff";
    ctx.fillRect(-CARD_SIZE / 2, -CARD_SIZE / 2, CARD_SIZE, CARD_SIZE * 1.3);
    ctx.strokeStyle = "#2a9d8f";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-CARD_SIZE / 2, -CARD_SIZE / 2, CARD_SIZE, CARD_SIZE * 1.3);
    ctx.shadowBlur = 0;
    ctx.fillStyle = c.card.suit === "♥" || c.card.suit === "♦" ? "#e63946" : "#1a1a2e";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(c.card.rank, 0, 2);
    ctx.font = "11px monospace";
    ctx.fillText(c.card.suit, 0, 16);
    ctx.globalAlpha = 1;
    ctx.restore();
  });

  // Enemies
  g.enemies.forEach((e) => {
    ctx.fillStyle = getEnemyColor(e.type);
    ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
    if (e.hp < e.maxHp) {
      ctx.fillStyle = "#333";
      ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 6, e.w, 3);
      ctx.fillStyle = "#4caf50";
      ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 6, e.w * (e.hp / e.maxHp), 3);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.fillText(getEnemyLabel(e.type), e.x, e.y + 3);
    // v2 Sprint 2 Commit 4: ザコ敵セリフ吹き出し
    if (e.dialogText && e.dialogLife && e.dialogMaxLife) {
      drawEnemyDialog(ctx, e.x, e.y - e.h / 2 - 18, e.dialogText, e.dialogLife, e.dialogMaxLife, getEnemyColor(e.type));
    }
  });

  // Boss
  if (g.boss) {
    const b = g.boss;
    // Sprint 3 Track A Phase 2: Stage 1-3 は drawStageBoss、Stage 4 CHIP LEADER は継続
    if (g.stageNum === 4 && b.chipLeaderPhase !== undefined) {
      drawChipLeader(ctx, b, g.stageTimer);
    } else if (g.stageNum >= 1 && g.stageNum <= 3) {
      drawStageBoss(ctx, b, g.stageNum, g.stageTimer);
    } else {
      // 未知ステージの安全フォールバック
      const gradient = ctx.createRadialGradient(b.x + 25, b.y + 25, 5, b.x + 25, b.y + 25, 35);
      gradient.addColorStop(0, "#ffd700");
      gradient.addColorStop(1, "#ff4444");
      ctx.fillStyle = gradient;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }
    // Stage 4 のみ bossName ラベル表示 (Stage 1-3 は drawStageBoss 内で独自描画)
    // bbox 幅に依存しない中央基準 (旧 b.x + 25 は 50px bbox 前提のハードコード)
    if (g.stageNum === 4) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(g.cfg.bossName, b.x + b.w / 2, b.y - 12);
    }
    // HP バー (全ステージ共通、bbox 幅に追従)
    const hpBarW = b.w + 20;
    const hpBarX = b.x - 10;
    ctx.fillStyle = "#333";
    ctx.fillRect(hpBarX, b.y - 6, hpBarW, 5);
    ctx.fillStyle = b.hp / b.maxHp > 0.3 ? "#ff4444" : "#ff0000";
    ctx.fillRect(hpBarX, b.y - 6, hpBarW * (b.hp / b.maxHp), 5);
  }

  // Player bullets (v2 縦画面化: 縦長矩形で上方向弾の形に)
  g.bullets.forEach((b) => {
    ctx.fillStyle = b.color || "#4ecdc4";
    const s = b.size || 4;
    ctx.fillRect(b.x - s / 2, b.y - s * 2, s, s * 2);
    if (s > 5) {
      ctx.shadowColor = b.color || "#4ecdc4";
      ctx.shadowBlur = 6;
      ctx.fillRect(b.x - s / 2, b.y - s * 2, s, s * 2);
      ctx.shadowBlur = 0;
    }
  });

  // Enemy bullets
  g.enemyBullets.forEach((b) => {
    if (b.style === "chip") {
      drawChipBullet(ctx, b);
    } else {
      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Player
  ctx.save();
  ctx.translate(g.player.x, g.player.y);
  if (g.player.invincible > 0 && Math.floor(g.player.invincible / 4) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#e8e8e8";
  ctx.fill();
  ctx.strokeStyle = "#4ecdc4";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_SIZE / 4, 0, Math.PI * 2);
  ctx.fillStyle = "#4ecdc4";
  ctx.fill();
  ctx.restore();

  // Particles
  g.particles.forEach((p) => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  });
  ctx.globalAlpha = 1;

  // Floating texts
  g.floatingTexts.forEach((t) => {
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.fillStyle = t.color;
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(t.text, t.x, t.y);
  });
  ctx.globalAlpha = 1;

  // HUD: slots + hand preview
  const slotY = CANVAS_H - 60;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, CANVAS_H - 80, CANVAS_W, 80);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_H - 80);
  ctx.lineTo(CANVAS_W, CANVAS_H - 80);
  ctx.stroke();

  const collected = g.collectedCards;
  for (let i = 0; i < 5; i++) {
    const sx = CANVAS_W / 2 - 120 + i * 52;
    if (collected[i]) {
      const c = collected[i];
      ctx.fillStyle = "#fff";
      ctx.fillRect(sx, slotY - 16, 40, 50);
      ctx.strokeStyle = "#4ecdc4";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, slotY - 16, 40, 50);
      ctx.fillStyle = c.suit === "♥" || c.suit === "♦" ? "#e63946" : "#1a1a2e";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(c.rank, sx + 20, slotY + 8);
      ctx.font = "14px monospace";
      ctx.fillText(c.suit, sx + 20, slotY + 25);
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, slotY - 16, 40, 50);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("?", sx + 20, slotY + 10);
    }
  }

  if (collected.length >= 5) {
    const r = evaluateHand(collected);
    ctx.fillStyle = HAND_COLORS[r.name] || "#888";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${HAND_NAMES[r.name]} (×${r.mult})`, CANVAS_W / 2, CANVAS_H - 4);
  }

  // v2 Sprint 2: CHIP LEADER 戦スタックバー HUD
  if (g.stageNum === 4 && g.phase === "boss" && g.boss?.stackBB !== undefined && g.playerStackBB !== undefined) {
    drawStackBar(g, ctx);
  }

  // v2 Sprint 2 Commit 2: チップパーティクル (HUD 吸い込み)
  if (g.chipParticles && g.chipParticles.length > 0) {
    drawChipParticles(g, ctx);
  }

  // v2 Sprint 2: Phase 転換テキスト
  if (g.phaseTransition) {
    drawPhaseTransition(g, ctx);
  }

  // v2 Sprint 2 Commit 3: ワンアウター演出オーバーレイ (Stage 3 SLOW PLAYER GOD)
  if (g.oneOuterSequence) {
    drawOneOuterOverlay(g, ctx);
  }

  // v2 Sprint 2 Commit 4: Stage 別フラッシュ (Stage 3 赤フラッシュ)
  drawStageFlash(ctx, g.stageNum, g.stageTimer);

  ctx.restore();
}

// v2 Sprint 2 Commit 3: ワンアウター 2000ms 演出
// t=0-20%: 画面暗転 alpha 0→0.85 (gameplay-design §3-2)
// t=20%-30%: テキスト表示開始 + ボス高笑い
// t=30%-70%: HP 回復アニメ (BossManager 側で hp は即回復済み、視覚演出のみ)
// t=70%-90%: テキスト fadeout
// t=90%-100%: 暗転 fadeout
function drawOneOuterOverlay(g: GameState, ctx: CanvasRenderingContext2D) {
  if (!g.oneOuterSequence) return;
  const { life, maxLife } = g.oneOuterSequence;
  const progress = 1 - life / maxLife; // 0 → 1

  // 暗転 alpha: 0→0.85 (0-20%), hold (20-90%), 0.85→0 (90-100%)
  let darkAlpha = 0;
  if (progress < 0.2) darkAlpha = (progress / 0.2) * 0.85;
  else if (progress < 0.9) darkAlpha = 0.85;
  else darkAlpha = (1 - progress) / 0.1 * 0.85;

  ctx.save();
  ctx.globalAlpha = darkAlpha;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();

  // テキスト表示 (20-90%)
  if (progress >= 0.2 && progress < 0.9) {
    let textAlpha = 1;
    if (progress < 0.3) textAlpha = (progress - 0.2) / 0.1;
    else if (progress > 0.7) textAlpha = (0.9 - progress) / 0.2;
    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = ONE_OUTER_TEXT.color;
    ctx.font = `bold ${ONE_OUTER_TEXT.fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = ONE_OUTER_TEXT.color;
    ctx.shadowBlur = 15;
    ctx.fillText(ONE_OUTER_TEXT.text, CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();
  }
}

function drawChipParticles(g: GameState, ctx: CanvasRenderingContext2D) {
  if (!g.chipParticles) return;
  ctx.save();
  for (const p of g.chipParticles) {
    const lifeRatio = p.life / p.maxLife;
    ctx.globalAlpha = Math.min(1, lifeRatio * 1.5);
    // 金チップ (r=4) + 縁
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c99700";
    ctx.lineWidth = 1;
    ctx.stroke();
    // 中心の白い光沢
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStackBar(g: GameState, ctx: CanvasRenderingContext2D) {
  if (!g.boss || g.playerStackBB === undefined || g.boss.stackBB === undefined) return;
  const totalBB = 120;
  const barX = 70;
  const barW = CANVAS_W - 90;
  const barH = 10;
  const yPlayer = 60;
  const yBoss = 74;

  // Player bar
  ctx.fillStyle = STACK_BAR_COLORS.playerBg;
  ctx.fillRect(barX, yPlayer, barW, barH);
  const playerRatio = Math.min(1, g.playerStackBB / totalBB);
  const isShort = g.playerStackBB < 40;
  ctx.fillStyle = isShort ? STACK_BAR_COLORS.playerLow : STACK_BAR_COLORS.playerFill;
  ctx.fillRect(barX, yPlayer, barW * playerRatio, barH);

  // Boss bar
  ctx.fillStyle = STACK_BAR_COLORS.playerBg;
  ctx.fillRect(barX, yBoss, barW, barH);
  const bossRatio = Math.min(1, g.boss.stackBB / totalBB);
  const bossLeading = g.boss.stackBB > g.playerStackBB;
  ctx.fillStyle = bossLeading ? STACK_BAR_COLORS.bossLead : STACK_BAR_COLORS.bossFill;
  ctx.fillRect(barX, yBoss, barW * bossRatio, barH);

  // Labels
  ctx.fillStyle = STACK_BAR_COLORS.bbText;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("YOU", 10, yPlayer + 8);
  ctx.fillText("BOSS", 10, yBoss + 8);
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(g.playerStackBB)}BB`, CANVAS_W - 10, yPlayer + 8);
  ctx.fillText(`${Math.round(g.boss.stackBB)}BB`, CANVAS_W - 10, yBoss + 8);

  // SHORT STACK 警告 (Phase 1 絶望感)
  if (isShort && g.boss.chipLeaderPhase === 1) {
    const blink = Math.floor(g.stageTimer / 20) % 2 === 0;
    if (blink) {
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("⚠ SHORT STACK ⚠", CANVAS_W / 2, yPlayer + 8);
    }
  }
}

function drawPhaseTransition(g: GameState, ctx: CanvasRenderingContext2D) {
  if (!g.phaseTransition) return;
  const t = g.phaseTransition;
  const progress = 1 - t.life / t.maxLife; // 0→1
  const config = PHASE_TRANSITION_TEXT[t.kind];

  // 画面フラッシュ (0-200ms = progress 0-0.15 程度)
  const flashProgress = Math.max(0, 1 - progress * 6);
  if (flashProgress > 0) {
    ctx.save();
    ctx.globalAlpha = flashProgress * 0.4;
    ctx.fillStyle = t.kind === "CHIP_LEAD_CHANGE" ? "#ff00ff" : "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }

  // テキストのスケール: 0→1.3→1.0 の punch-in
  let scale = 1.0;
  if (progress < 0.15) scale = progress / 0.15 * 1.3;
  else if (progress < 0.25) scale = 1.3 - (progress - 0.15) * 3;
  else scale = 1.0;

  // テキストの alpha: 0→1 (punch-in) → 1 (hold) → 0 (fadeout)
  let alpha = 1.0;
  if (progress < 0.15) alpha = progress / 0.15;
  else if (progress > 0.7) alpha = Math.max(0, (1 - progress) / 0.3);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = config.color;
  ctx.font = `bold ${config.fontSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = config.color;
  ctx.shadowBlur = 20;
  ctx.fillText(config.text, 0, 0);
  ctx.restore();
}

// v2 Sprint 2 Commit 4: ドンクチップ弾描画 ($5 白 / $25 赤 / $100 緑 + 回転)
function drawChipBullet(ctx: CanvasRenderingContext2D, b: { x: number; y: number; chipValue?: number; rotation?: number }) {
  const value = b.chipValue ?? 5;
  const color = value === 100 ? "#4caf50" : value === 25 ? "#e63946" : "#f5f5f5";
  const rim = value === 100 ? "#2e7d32" : value === 25 ? "#8b0000" : "#9e9e9e";
  const r = value === 100 ? 7 : 6;
  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.rotation) ctx.rotate(b.rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // 縞模様 (チップ感)
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

// v2 Sprint 2 Commit 4: ザコ敵セリフ吹き出し (背景角丸矩形 + テキスト)
function drawEnemyDialog(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  text: string,
  life: number, maxLife: number,
  borderColor: string,
) {
  const ratio = life / maxLife;
  // fadeIn 0-10% / hold 10-85% / fadeOut 85-100%
  let alpha = 1;
  if (ratio > 0.9) alpha = (1 - ratio) / 0.1;
  else if (ratio < 0.15) alpha = Math.max(0, 1 - (0.15 - ratio) / 0.15);
  alpha = Math.max(0, Math.min(1, alpha));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "bold 10px 'Noto Sans JP', monospace";
  const metrics = ctx.measureText(text);
  const padX = 4;
  const padY = 3;
  const w = Math.ceil(metrics.width) + padX * 2;
  const h = 14;
  const bx = x - w / 2;
  const by = y - h;
  // 背景
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(bx, by, w, h);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, w, h);
  // テキスト
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, by + h / 2);
  ctx.restore();
}

// v2 Sprint 2 Commit 4: Stage 別背景装飾
// 藤井 art-direction §4 準拠 (簡略版、BGM/複雑アニメは Sprint 3 分離)
function drawStageDecor(ctx: CanvasRenderingContext2D, stageNum: number, t: number) {
  if (stageNum === 1) {
    // Stage 1: ビールジョッキ + ポップコーン散布 (v2 縦画面化: 下部 HUD を避け右上寄り)
    ctx.save();
    // ビールジョッキ (右上)
    const mugX = CANVAS_W - 50;
    const mugY = 60;
    ctx.fillStyle = "#f5deb3";
    ctx.fillRect(mugX, mugY, 20, 36);
    ctx.fillStyle = "#fff";
    ctx.fillRect(mugX, mugY, 20, 8); // 泡
    ctx.strokeStyle = "#8b7a4b";
    ctx.lineWidth = 2;
    ctx.strokeRect(mugX, mugY, 20, 36);
    // ポップコーン (右側縦列 5 粒)
    const popcorn = [
      [CANVAS_W - 30, 70], [CANVAS_W - 20, 76], [CANVAS_W - 32, 82],
      [CANVAS_W - 22, 88], [CANVAS_W - 28, 94],
    ];
    ctx.fillStyle = "#fff59d";
    for (const [px, py] of popcorn) {
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (stageNum === 2) {
    // Stage 2: タイムバンクメーター (上部中央)
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(CANVAS_W / 2 - 50, 4, 100, 4);
    const tbRatio = 0.5 + 0.5 * Math.sin(t * 0.02); // 0.5Hz 程度で演出
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(CANVAS_W / 2 - 50, 4, 100 * tbRatio, 4);
    // 観客ざわつき (小さい点を 20 粒、位置固定)
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 20; i++) {
      const px = ((i * 37) % CANVAS_W);
      const py = ((i * 53) % 80) + 100;
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.restore();
  } else if (stageNum === 3) {
    // Stage 3: バブルカウンター (右上) + 観客シルエット (下)
    ctx.save();
    const blink = Math.floor(t / 20) % 2 === 0;
    if (blink) {
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("BUBBLE 残り3人", CANVAS_W - 10, 46);
    }
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, CANVAS_H - 12, CANVAS_W, 12);
    ctx.restore();
  } else if (stageNum === 4) {
    // Stage 4: スポットライト + 観客シルエット両端 + LIVE STREAMING
    ctx.save();
    // 中央スポットライト
    const grad = ctx.createRadialGradient(CANVAS_W / 2, 0, 50, CANVAS_W / 2, 0, 400);
    grad.addColorStop(0, "rgba(255,255,255,0.15)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // 両端観客シルエット
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 40, CANVAS_H);
    ctx.fillRect(CANVAS_W - 40, 0, 40, CANVAS_H);
    // LIVE STREAMING (0.5Hz 点滅)
    const livePulse = Math.floor(t / 30) % 2 === 0;
    if (livePulse) {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath(); ctx.arc(CANVAS_W / 2 - 44, 46, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("LIVE STREAMING", CANVAS_W / 2 - 38, 49);
    }
    ctx.restore();
  }
}

// v2 Sprint 2 Commit 4: Stage 3 赤フラッシュ (3秒間隔で 0.2秒)
function drawStageFlash(ctx: CanvasRenderingContext2D, stageNum: number, t: number) {
  if (stageNum !== 3) return;
  const cycle = t % 180; // 3 秒 = 180 frames
  if (cycle < 12) {
    // 0-12 frame = 200ms 赤フラッシュ
    const alpha = 0.3 * (1 - cycle / 12);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}
