import { GameState, CANVAS_W, CANVAS_H, CARD_SIZE, PLAYER_SIZE } from "../state/GameState";
import { getEnemyColor, getEnemyLabel } from "../stages/enemyStats";
import { evaluateHand } from "../hand/evaluateHand";
import { HAND_COLORS, HAND_NAMES } from "../hand/constants";

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
    const isJunk = c.card.rank === "8" || c.card.rank === "9";
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.globalAlpha = c.glow;
    ctx.shadowColor = isJunk ? "#ff6b6b" : "#4ecdc4";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#fff";
    ctx.fillRect(-CARD_SIZE / 2, -CARD_SIZE / 2, CARD_SIZE, CARD_SIZE * 1.3);
    ctx.strokeStyle = isJunk ? "#ff6b6b" : "#2a9d8f";
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
    const gradient = ctx.createRadialGradient(b.x + 25, b.y + 25, 5, b.x + 25, b.y + 25, 35);
    gradient.addColorStop(0, "#ffd700");
    gradient.addColorStop(1, "#ff4444");
    ctx.fillStyle = gradient;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
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
  ctx.fillStyle = g.player.flash > 0 ? "#ff6b6b" : "#e8e8e8";
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

  ctx.restore();
}
