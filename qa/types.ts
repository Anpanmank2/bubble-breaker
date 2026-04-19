// Phase 6 QA simulator types
// Owner 承認設計: qa-design.md / 2026-04-19

export type Archetype = "Casual" | "Experienced" | "Min-Maxer" | "Explorer" | "Speed-runner";

export type Persona = {
  nickname: string;
  archetype: Archetype;
  reaction_ms: number;        // 100-500ms 敵弾検知 → 回避
  precision: number;          // 0.3-0.95 照準/追従精度
  risk_tolerance: number;     // 0-1 (low: 防御 / high: 攻撃)
  game_literacy: number;      // 0-1 HUD 読解力 (Phase 認識)
  attention_span_s: number;   // 30-300 秒 持続力 (Stage 4 まで粘れるか)
  reads_text: boolean;        // Phase 転換テキスト等を読む
  observes_decor: boolean;    // 背景装飾に注目
};

export type FrameSnapshot = {
  t_ms: number;                // 経過 ms (run start からの相対)
  screen: string;              // "title" | "playing" | "boss" | "handReveal" | "clear" | "gameover" | "royalClear"
  stage: number;               // 1-4
  lives: number;
  score: number;
  boss_hp?: number;
  boss_max_hp?: number;
  chip_leader_phase?: 1 | 2 | 3;
  one_outer_used?: boolean;
  phase_transition_kind?: string | null;
  player_x: number;
  player_y: number;
  enemy_bullets_count: number;
  chip_particles_count: number;
  fps_frame: number;           // window.__fpsFrame の累計
};

export type RunResult = {
  persona_nickname: string;
  archetype: Archetype;
  run_index: number;           // 0-2 (各ペルソナ 3 run)
  duration_ms: number;
  outcome: "clear" | "royalClear" | "gameover" | "timeout";
  final_screen: string;
  max_stage_reached: number;   // 1-4
  boss_killed: boolean;
  chip_leader_phases_reached: (1 | 2 | 3)[];  // Stage 4 のみ意味あり
  one_outer_fired: boolean;     // Stage 3 のみ意味あり
  lives_lost: number;           // 3 - final lives
  fps_avg: number | null;
  fps_p5: number | null;        // 5 percentile
  // 軸 B: 直感理解
  initial_input_latency_ms: number | null;  // ENTRY click → 最初の inputActive
  phase_transition_reactions: Array<{
    kind: string;
    t_ms: number;
    movement_post_ms: number;   // 転換後 1 秒間の移動量 px
  }>;
  // 軸 C: 機能必要性
  decor_proximity_count: number;  // 背景装飾エリアへの接近回数
  dialog_visible_pause_count: number;  // ザコセリフ吹き出し中の停止回数
  notes: string[];
};

export type AggregateMetrics = {
  total_runs: number;
  clear_rate: {
    overall: number;            // 0-1
    by_archetype: Record<Archetype, number>;
    by_persona: Record<string, number>;  // 0/3, 1/3, 2/3, 3/3
  };
  stage4_reach_rate: number;
  stage4_kill_rate: number;
  avg_kill_duration_ms: number | null;
  one_outer_fire_rate: number;
  phase_2_reach_rate: number;
  phase_3_reach_rate: number;
  avg_lives_lost_stage4: number;
  fps_p95_above_50_rate: number;
};
