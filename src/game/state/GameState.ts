import { Card } from "../hand/constants";
import { StageConfig } from "../stages/stageConfig";
import { EnemyType } from "../stages/enemyStats";

export const CANVAS_W = 480;
export const CANVAS_H = 720;
export const PLAYER_SIZE = 24;
export const BULLET_SPEED = 8;
export const CARD_SIZE = 28;

export type Player = {
  x: number; y: number;
  shooting: boolean;
  invincible: number;
};

export type Bullet = {
  x: number; y: number;
  speed: number; vy?: number;
  dmg: number; size: number; color: string;
};

export type EnemyBullet = { x: number; y: number; vx: number; vy: number };

export type Enemy = {
  x: number; y: number;
  type: EnemyType;
  hp: number; maxHp: number;
  speed: number;
  shootTimer: number;
  w: number; h: number;
  sinOffset: number; sinAmp: number;
};

export type FieldCard = {
  x: number; y: number;
  card: Card;
  speed: number;
  sinOffset: number; sinAmp: number;
  time: number; glow: number;
};

export type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number; color: string;
};

export type FloatingText = {
  x: number; y: number;
  text: string; color: string;
  life: number; maxLife: number;
};

export type Boss = {
  x: number; y: number;
  w: number; h: number;
  hp: number; maxHp: number;
  shootTimer: number;
  sinOffset: number;
  phase: number;
};

export type GamePhase = "collect" | "transition" | "boss";

export type GameState = {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  enemyBullets: EnemyBullet[];
  cards: FieldCard[];
  collectedCards: Card[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  spawnTimer: number;
  cardDropCount: number;
  maxCardDrops: number;
  phase: GamePhase;
  boss: Boss | null;
  bossDefeated: boolean;
  stageTimer: number;
  collectDuration: number;
  cfg: StageConfig;
  stageNum: number;
  scrollX: number;
  shakeDuration: number;
  shakeIntensity: number;
  inputY: number;
  inputX: number;
  inputActive: boolean;
  score: number;
  combo: number;
  handMult?: number;
  handValue?: number;
  handPower?: number;
  transitionTimer?: number;
};

export function createGameState(stageNum: number, cfg: StageConfig): GameState {
  return {
    player: { x: 80, y: CANVAS_H / 2, shooting: true, invincible: 0 },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    cards: [],
    collectedCards: [],
    particles: [],
    floatingTexts: [],
    spawnTimer: 0,
    cardDropCount: 0,
    maxCardDrops: cfg.cardDrops,
    phase: "collect",
    boss: null,
    bossDefeated: false,
    stageTimer: 0,
    collectDuration: 25 * 60,
    cfg,
    stageNum,
    scrollX: 0,
    shakeDuration: 0,
    shakeIntensity: 0,
    inputY: CANVAS_H / 2,
    inputX: 80,
    inputActive: false,
    score: 0,
    combo: 0,
  };
}

export function addParticles(g: GameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    g.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      color,
    });
  }
}

export function addFloatingText(g: GameState, x: number, y: number, text: string, color: string) {
  g.floatingTexts.push({ x, y, text, color, life: 40, maxLife: 40 });
}
