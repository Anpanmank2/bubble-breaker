import { GameState, CANVAS_W, CANVAS_H, CARD_SIZE, PLAYER_SIZE } from "../state/GameState";
import { getEnemyColor, getEnemyLabel } from "../stages/enemyStats";
import { evaluateHand } from "../hand/evaluateHand";
import { HAND_COLORS, HAND_NAMES } from "../hand/constants";
import { STACK_BAR_COLORS, PHASE_TRANSITION_TEXT, ONE_OUTER_TEXT } from "../characters/constants";
import { drawChipLeader } from "../boss/chipLeaderFx";

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

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = -(g.scrollX % 40); x < CANVAS_W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 40) {
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
  });

  // Boss
  if (g.boss) {
    const b = g.boss;
    // v2 Sprint 2 Commit 3: Stage 4 CHIP LEADER は専用 11 レイヤー描画に差し替え
    if (g.stageNum === 4 && b.chipLeaderPhase !== undefined) {
      drawChipLeader(ctx, b, g.stageTimer);
    } else {
      const gradient = ctx.createRadialGradient(b.x + 25, b.y + 25, 5, b.x + 25, b.y + 25, 35);
      gradient.addColorStop(0, "#ffd700");
      gradient.addColorStop(1, "#ff4444");
      ctx.fillStyle = gradient;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(g.cfg.bossName, b.x + 25, b.y - 12);
    ctx.fillStyle = "#333";
    ctx.fillRect(b.x - 10, b.y - 6, 70, 5);
    ctx.fillStyle = b.hp / b.maxHp > 0.3 ? "#ff4444" : "#ff0000";
    ctx.fillRect(b.x - 10, b.y - 6, 70 * (b.hp / b.maxHp), 5);
  }

  // Player bullets
  g.bullets.forEach((b) => {
    ctx.fillStyle = b.color || "#4ecdc4";
    const s = b.size || 4;
    ctx.fillRect(b.x, b.y - s / 2, s * 2, s);
    if (s > 5) {
      ctx.shadowColor = b.color || "#4ecdc4";
      ctx.shadowBlur = 6;
      ctx.fillRect(b.x, b.y - s / 2, s * 2, s);
      ctx.shadowBlur = 0;
    }
  });

  // Enemy bullets
  ctx.fillStyle = "#ff6b6b";
  g.enemyBullets.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
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
