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

// v2 Sprint 2 Commit 4: ドンクチップ弾 ($5/$25/$100) + 重力対応
export type EnemyBulletStyle = "normal" | "chip";
export type ChipValue = 5 | 25 | 100;

export type EnemyBullet = {
  x: number; y: number;
  vx: number; vy: number;
  style?: EnemyBulletStyle;
  chipValue?: ChipValue;
  gravity?: number;
  rotation?: number;
  rotationSpeed?: number;
};

export type Enemy = {
  x: number; y: number;
  type: EnemyType;
  hp: number; maxHp: number;
  speed: number;
  shootTimer: number;
  w: number; h: number;
  sinOffset: number; sinAmp: number;
  // v2 Sprint 2 Commit 4: セリフ吹き出し
  dialogText?: string;
  dialogLife?: number;
  dialogMaxLife?: number;
  hpHalfTriggered?: boolean;
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

// v2 Sprint 2
export type BossPhase = 1 | 2 | 3;
export type BossFaceState = "calm" | "sweat" | "panic";
export type BossAccessoryState = "intact" | "cracked" | "broken";

export type Boss = {
  x: number; y: number;
  w: number; h: number;
  hp: number; maxHp: number;
  shootTimer: number;
  sinOffset: number;
  // v2 Sprint 2: CHIP LEADER 戦用
  stackBB?: number;
  chipLeaderPhase?: BossPhase;
  oneOuterUsed?: boolean;
  faceState?: BossFaceState;
  accessoryState?: BossAccessoryState;
  sunglassesY?: number;
  sunglassesRotation?: number;
  sunglassesAlpha?: number;
  // Commit 3: サングラス吹っ飛びアニメ動力 (放物線)
  sunglassesVy?: number;
  sunglassesBlowoffLife?: number;
};

export type PhaseTransitionKind = "EVEN_STACK" | "CHIP_LEAD_CHANGE" | "ALL_IN_CHIP" | "ALL_IN_3BET";

export type PhaseTransition = {
  kind: PhaseTransitionKind;
  life: number;
  maxLife: number;
};

// v2 Sprint 2 Commit 2: チップパーティクル (ヒット位置 → HUD ベジェ吸い込み)
export type ChipParticleKind = "to-player" | "to-boss";

export type ChipParticle = {
  x: number; y: number;
  targetX: number; targetY: number;
  vy: number;
  life: number; maxLife: number;
  color: string;
  kind: ChipParticleKind;
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
  scrollY: number;
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
  // v2 Sprint 2
  playerStackBB?: number;
  phaseTransition?: PhaseTransition;
  // v2 Sprint 2 Commit 2: phaseTransition 中の被弾無効残フレーム
  phaseImmuneRemain?: number;
  chipParticles?: ChipParticle[];
  // v2 Sprint 2 Commit 3: SLOW PLAYER GOD ワンアウター演出シーケンス (2000ms)
  oneOuterSequence?: OneOuterSequence;
};

// v2 Sprint 2 Commit 3: ワンアウター演出状態
// t=0-400ms 画面暗転 / t=400-600 テキスト表示 / t=600-1400 HP回復アニメ
// t=1400-1800 フェード / t=1800-2000 BGM 復帰
export type OneOuterSequence = {
  life: number;
  maxLife: number;
};

export function createGameState(stageNum: number, cfg: StageConfig): GameState {
  return {
    // v2 縦画面化: プレイヤー初期位置を下部中央、入力ターゲットも下部
    player: { x: CANVAS_W / 2, y: CANVAS_H - 140, shooting: true, invincible: 0 },
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
    scrollY: 0,
    shakeDuration: 0,
    shakeIntensity: 0,
    inputY: CANVAS_H - 140,
    inputX: CANVAS_W / 2,
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
