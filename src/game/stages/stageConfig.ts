export type StageConfig = {
  name: string;
  blind: string;
  bg: string;
  enemySpeed: number;
  enemyHp: number;
  spawnRate: number;
  bulletSpeed: number;
  cardDrops: number;
  junkRate: number;
  bossHp: number;
  bossName: string;
  remaining: number;
};

export const STAGE_CONFIGS: Record<1 | 2 | 3 | 4, StageConfig> = {
  1: { name: "EARLY LEVEL",  blind: "100/200",    bg: "#1a472a", enemySpeed: 0.8, enemyHp: 1, spawnRate: 90, bulletSpeed: 1.8, cardDrops: 12, junkRate: 0,    bossHp: 80,   bossName: "DONK BET KING",    remaining: 247 },
  2: { name: "MIDDLE LEVEL", blind: "500/1000",   bg: "#1a3a2a", enemySpeed: 1.5, enemyHp: 2, spawnRate: 60, bulletSpeed: 2.8, cardDrops: 10, junkRate: 0,    bossHp: 300,  bossName: "3-BET MONSTER",    remaining: 84 },
  3: { name: "BUBBLE LINE",  blind: "2000/4000",  bg: "#2a1a1a", enemySpeed: 2.2, enemyHp: 3, spawnRate: 42, bulletSpeed: 3.8, cardDrops: 8,  junkRate: 0.35, bossHp: 800,  bossName: "SLOW PLAYER GOD",  remaining: 27 },
  4: { name: "FINAL TABLE",  blind: "5000/10000", bg: "#0a0a1a", enemySpeed: 2.6, enemyHp: 3, spawnRate: 35, bulletSpeed: 4.2, cardDrops: 8,  junkRate: 0.30, bossHp: 1200, bossName: "CHIP LEADER",      remaining: 9 },
};

export function getStageConfig(sn: number): StageConfig {
  return STAGE_CONFIGS[(sn as 1 | 2 | 3 | 4)] ?? STAGE_CONFIGS[1];
}

export const STAGE_NAMES: Record<number, string> = {
  1: "EARLY LEVEL",
  2: "MIDDLE LEVEL",
  3: "BUBBLE LINE",
  4: "FINAL TABLE",
};

export const DEATH_MESSAGES: Record<number, string> = {
  1: "アーリーバストアウトです、食べに行きましょう",
  2: "ミドルで散ったね、お疲れさまでした",
  3: "バブル・ボーイあと少しだったのに…",
  4: "ファイナルテーブルで敗北、チップリーダーの壁は厚い",
};
