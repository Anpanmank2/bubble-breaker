import type { Persona } from "./types";

// Owner 承認分布: Casual 6 / Experienced 8 / Min-Maxer 3 / Explorer 2 / Speed-runner 1
export const PERSONAS: Persona[] = [
  // ===== Casual (6) — 一般 web ユーザー想定。Stage 1-2 で死亡多い =====
  { nickname: "casual-akiko",   archetype: "Casual",       reaction_ms: 480, precision: 0.30, risk_tolerance: 0.20, game_literacy: 0.20, attention_span_s: 60,  reads_text: false, observes_decor: true  },
  { nickname: "casual-ryota",   archetype: "Casual",       reaction_ms: 420, precision: 0.35, risk_tolerance: 0.25, game_literacy: 0.30, attention_span_s: 75,  reads_text: false, observes_decor: false },
  { nickname: "casual-mika",    archetype: "Casual",       reaction_ms: 500, precision: 0.32, risk_tolerance: 0.40, game_literacy: 0.25, attention_span_s: 90,  reads_text: true,  observes_decor: true  },
  { nickname: "casual-takeshi", archetype: "Casual",       reaction_ms: 450, precision: 0.40, risk_tolerance: 0.35, game_literacy: 0.20, attention_span_s: 60,  reads_text: false, observes_decor: false },
  { nickname: "casual-yuki",    archetype: "Casual",       reaction_ms: 380, precision: 0.45, risk_tolerance: 0.30, game_literacy: 0.40, attention_span_s: 100, reads_text: true,  observes_decor: false },
  { nickname: "casual-shinji",  archetype: "Casual",       reaction_ms: 460, precision: 0.38, risk_tolerance: 0.50, game_literacy: 0.30, attention_span_s: 80,  reads_text: false, observes_decor: true  },

  // ===== Experienced (8) — シューティング経験者。Stage 3-4 まで到達 =====
  { nickname: "exp-haruto",     archetype: "Experienced",  reaction_ms: 280, precision: 0.65, risk_tolerance: 0.55, game_literacy: 0.55, attention_span_s: 150, reads_text: true,  observes_decor: false },
  { nickname: "exp-saori",      archetype: "Experienced",  reaction_ms: 250, precision: 0.70, risk_tolerance: 0.60, game_literacy: 0.60, attention_span_s: 180, reads_text: true,  observes_decor: true  },
  { nickname: "exp-koji",       archetype: "Experienced",  reaction_ms: 300, precision: 0.60, risk_tolerance: 0.50, game_literacy: 0.50, attention_span_s: 140, reads_text: false, observes_decor: false },
  { nickname: "exp-natsumi",    archetype: "Experienced",  reaction_ms: 270, precision: 0.68, risk_tolerance: 0.65, game_literacy: 0.55, attention_span_s: 160, reads_text: true,  observes_decor: false },
  { nickname: "exp-daichi",     archetype: "Experienced",  reaction_ms: 290, precision: 0.62, risk_tolerance: 0.70, game_literacy: 0.45, attention_span_s: 130, reads_text: false, observes_decor: true  },
  { nickname: "exp-rina",       archetype: "Experienced",  reaction_ms: 260, precision: 0.72, risk_tolerance: 0.55, game_literacy: 0.65, attention_span_s: 200, reads_text: true,  observes_decor: false },
  { nickname: "exp-kenji",      archetype: "Experienced",  reaction_ms: 310, precision: 0.58, risk_tolerance: 0.45, game_literacy: 0.50, attention_span_s: 145, reads_text: false, observes_decor: false },
  { nickname: "exp-aya",        archetype: "Experienced",  reaction_ms: 240, precision: 0.75, risk_tolerance: 0.60, game_literacy: 0.70, attention_span_s: 180, reads_text: true,  observes_decor: true  },

  // ===== Min-Maxer (3) — 反応速・精度高、HUD 読み込み、ワンアウター期待 =====
  { nickname: "minmax-yuto",    archetype: "Min-Maxer",    reaction_ms: 180, precision: 0.85, risk_tolerance: 0.75, game_literacy: 0.90, attention_span_s: 240, reads_text: true,  observes_decor: false },
  { nickname: "minmax-airi",    archetype: "Min-Maxer",    reaction_ms: 160, precision: 0.88, risk_tolerance: 0.70, game_literacy: 0.95, attention_span_s: 280, reads_text: true,  observes_decor: false },
  { nickname: "minmax-shun",    archetype: "Min-Maxer",    reaction_ms: 200, precision: 0.82, risk_tolerance: 0.80, game_literacy: 0.85, attention_span_s: 220, reads_text: true,  observes_decor: false },

  // ===== Explorer (2) — attention 短、observes_decor 高、装飾やセリフに注目 =====
  { nickname: "explorer-mei",   archetype: "Explorer",     reaction_ms: 350, precision: 0.50, risk_tolerance: 0.40, game_literacy: 0.45, attention_span_s: 60,  reads_text: true,  observes_decor: true  },
  { nickname: "explorer-jun",   archetype: "Explorer",     reaction_ms: 380, precision: 0.45, risk_tolerance: 0.35, game_literacy: 0.40, attention_span_s: 50,  reads_text: true,  observes_decor: true  },

  // ===== Speed-runner (1) — 最短撃破狙い =====
  { nickname: "speedrun-ace",   archetype: "Speed-runner", reaction_ms: 100, precision: 0.92, risk_tolerance: 0.95, game_literacy: 0.95, attention_span_s: 300, reads_text: false, observes_decor: false },
];

export const RUNS_PER_PERSONA = 3;  // Owner 要件 2026-04-19: 1 体 3 回以上
