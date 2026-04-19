import type { Page } from "@playwright/test";
import type { Persona, FrameSnapshot } from "./types";

// ペルソナの行動モデルとフレームロガーを browser context に注入する
// browser 側に persona 属性を持たせ、setInterval で意思決定 + state 取得
// page navigate 後に呼出。__qaState を window に bootstrap する

export type RunArtifacts = {
  snapshots: FrameSnapshot[];
  start_ms: number;
  initial_input_latency_ms: number | null;
  phase_transitions: Array<{ kind: string; t_ms: number; movement_post_ms: number }>;
};

export async function injectBehavior(page: Page, persona: Persona): Promise<void> {
  await page.evaluate((p) => {
    type Gs = {
      boss: { x: number; w: number; hp: number; maxHp: number; chipLeaderPhase?: 1|2|3; oneOuterUsed?: boolean } | null;
      player: { x: number; y: number; invincible: number };
      phase: string;
      phaseTransition?: { kind: string };
      enemyBullets: Array<{ x: number; y: number }>;
      cards: Array<{ x: number; y: number }>;
      chipParticles?: Array<unknown>;
      stageNum: number;
      score: number;
      inputX: number;
      inputY: number;
      inputActive: boolean;
    };
    type WindowQA = Window & {
      __gs?: Gs;
      __fpsFrame?: number;
      __qaSnapshots?: Array<Record<string, unknown>>;
      __qaStartMs?: number;
      __qaFirstInputMs?: number | null;
      __qaPhaseTransitions?: Array<{ kind: string; t_ms: number; player_x_at: number; player_y_at: number; movement_post_px: number }>;
      __qaBehaviorId?: ReturnType<typeof setInterval>;
      __qaSnapshotId?: ReturnType<typeof setInterval>;
      __qaEnded?: boolean;
      __qaPersona?: Persona;
    };
    type Persona = typeof p;
    const w = window as WindowQA;

    // bootstrap state
    w.__qaSnapshots = [];
    w.__qaStartMs = Date.now();
    w.__qaFirstInputMs = null;
    w.__qaPhaseTransitions = [];
    w.__qaEnded = false;
    w.__qaPersona = p;

    let lastTransitionWatchedAt = 0;
    let postTransitionPlayerX = 0;
    let postTransitionPlayerY = 0;
    let postTransitionAccum = 0;

    // ========== BEHAVIOR LOOP (persona.reaction_ms) ==========
    w.__qaBehaviorId = setInterval(() => {
      if (w.__qaEnded) return;

      // 1. ENTRY screen detection (gs not yet populated → click btn-entry)
      if (!w.__gs) {
        const entry = document.querySelector('[data-testid="btn-entry"]') as HTMLElement | null;
        if (entry) entry.click();
        return;
      }

      const gs = w.__gs;

      // 2. FIGHT BOSS button (handReveal screen)
      const fightBtn = document.querySelector('[data-testid="btn-fight-boss"]') as HTMLElement | null;
      if (fightBtn) {
        fightBtn.click();
        return;
      }

      // 3. Game-over / clear screen detection (no gs.boss meaningful + no dom buttons)
      const busted = document.querySelector('.busted-title');
      const champion = document.querySelector('.champion-title');
      const royal = document.querySelector('.royal-clear-title');
      if (busted || champion || royal) {
        w.__qaEnded = true;
        return;
      }

      // 4. In-game decision
      const player = gs.player;
      const reach_threat_radius = 30 + p.precision * 50;  // higher precision = larger detection radius = earlier avoidance (Sprint 3 Track B-1 fix)

      // 4a. Threat avoidance (highest priority)
      let avoidVecX = 0, avoidVecY = 0;
      for (const b of gs.enemyBullets) {
        const dx = player.x - b.x;
        const dy = player.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < reach_threat_radius && d > 0.1) {
          // weight inversely with distance, push away
          const w_force = (reach_threat_radius - d) / reach_threat_radius;
          avoidVecX += (dx / d) * w_force * 50;
          avoidVecY += (dy / d) * w_force * 30;
        }
      }

      if (avoidVecX !== 0 || avoidVecY !== 0) {
        // imperfect avoidance: precision lower = noisier
        const noise = (1 - p.precision) * 30;
        gs.inputX = Math.max(20, Math.min(460, player.x + avoidVecX + (Math.random() - 0.5) * noise));
        gs.inputY = Math.max(100, Math.min(620, player.y + avoidVecY + (Math.random() - 0.5) * noise));
        gs.inputActive = true;
        if (w.__qaFirstInputMs === null) w.__qaFirstInputMs = Date.now() - (w.__qaStartMs ?? 0);
        return;
      }

      // 4b. Boss phase: track boss x
      if (gs.boss && gs.phase === "boss") {
        const targetX = gs.boss.x + gs.boss.w / 2 + (Math.random() - 0.5) * (1 - p.precision) * 80;
        gs.inputX = Math.max(20, Math.min(460, targetX));
        gs.inputY = Math.max(450, Math.min(620, player.y));  // stay in lower zone
        gs.inputActive = true;
        if (w.__qaFirstInputMs === null) w.__qaFirstInputMs = Date.now() - (w.__qaStartMs ?? 0);
        return;
      }

      // 4c. Collect phase: chase nearest card if risk_tolerance high
      if (gs.phase === "collect" && gs.cards.length > 0 && p.risk_tolerance > 0.4) {
        // pick nearest card
        let nearest = gs.cards[0];
        let minD = Infinity;
        for (const c of gs.cards) {
          const dx = c.x - player.x;
          const dy = c.y - player.y;
          const d = dx * dx + dy * dy;
          if (d < minD) { minD = d; nearest = c; }
        }
        gs.inputX = Math.max(20, Math.min(460, nearest.x));
        gs.inputY = Math.max(100, Math.min(620, nearest.y));
        gs.inputActive = true;
        if (w.__qaFirstInputMs === null) w.__qaFirstInputMs = Date.now() - (w.__qaStartMs ?? 0);
        return;
      }

      // 4d. Default: stay near center-bottom (defensive)
      gs.inputX = 240 + (Math.random() - 0.5) * 60;
      gs.inputY = 580 + (Math.random() - 0.5) * 30;
      gs.inputActive = true;
      if (w.__qaFirstInputMs === null) w.__qaFirstInputMs = Date.now() - (w.__qaStartMs ?? 0);

      // Track post-transition movement (for 軸 B metric)
      if (lastTransitionWatchedAt > 0 && Date.now() - lastTransitionWatchedAt < 1000) {
        const dx = player.x - postTransitionPlayerX;
        const dy = player.y - postTransitionPlayerY;
        postTransitionAccum += Math.sqrt(dx * dx + dy * dy);
        postTransitionPlayerX = player.x;
        postTransitionPlayerY = player.y;
      }
    }, p.reaction_ms);

    // ========== SNAPSHOT LOGGER (100ms 固定) ==========
    // Note: __qaEnded 後も snapshot は継続 (final state を捕捉するため、
    // harvestArtifacts の clearInterval で停止)
    w.__qaSnapshotId = setInterval(() => {
      const t_ms = Date.now() - (w.__qaStartMs ?? 0);
      const gs = w.__gs;
      if (!gs) {
        // gs 未露出時も最低限の screen state を記録 (debug 目的)
        const screen0 = (() => {
          if (document.querySelector('.busted-title')) return "gameover";
          if (document.querySelector('.champion-title')) return "clear";
          if (document.querySelector('[data-testid="btn-fight-boss"]')) return "handReveal";
          if (document.querySelector('[data-testid="btn-entry"]')) return "title";
          return "loading";
        })();
        w.__qaSnapshots!.push({
          t_ms, screen: screen0, stage: 1, lives: 3, score: 0,
          player_x: 0, player_y: 0, enemy_bullets_count: 0, chip_particles_count: 0,
          fps_frame: w.__fpsFrame ?? 0,
        });
        return;
      }

      // Detect phase transition (新しい transition が発生したか)
      const ptKind = gs.phaseTransition?.kind ?? null;
      if (ptKind && (w.__qaPhaseTransitions ?? []).every((x) => x.t_ms < t_ms - 500 || x.kind !== ptKind)) {
        // new transition
        w.__qaPhaseTransitions!.push({
          kind: ptKind,
          t_ms,
          player_x_at: gs.player.x,
          player_y_at: gs.player.y,
          movement_post_px: 0,  // accumulated next 1s
        });
        lastTransitionWatchedAt = Date.now();
        postTransitionPlayerX = gs.player.x;
        postTransitionPlayerY = gs.player.y;
        postTransitionAccum = 0;
      }

      // Finalize prior transition's movement_post_px after 1s
      for (const tr of w.__qaPhaseTransitions ?? []) {
        if (t_ms - tr.t_ms >= 1000 && tr.movement_post_px === 0 && postTransitionAccum > 0) {
          tr.movement_post_px = postTransitionAccum;
          postTransitionAccum = 0;
          lastTransitionWatchedAt = 0;
        }
      }

      const screen = (() => {
        if (document.querySelector('.busted-title')) return "gameover";
        if (document.querySelector('.champion-title')) return "clear";
        if (document.querySelector('.royal-clear-title')) return "royalClear";
        if (document.querySelector('[data-testid="btn-fight-boss"]')) return "handReveal";
        if (document.querySelector('[data-testid="btn-entry"]')) return "title";
        if (gs.boss) return "boss";
        return "playing";
      })();

      // Read lives from debug-panel (only available with ?debug=1)
      let lives = 3;
      const dp = document.querySelector('[data-testid="debug-panel"]')?.textContent ?? "";
      const lm = dp.match(/lives:\s*(\d+)/);
      if (lm) lives = parseInt(lm[1], 10);
      const sm = dp.match(/score:\s*(\d+)/);
      const score = sm ? parseInt(sm[1], 10) : gs.score;

      w.__qaSnapshots!.push({
        t_ms,
        screen,
        stage: gs.stageNum,
        lives,
        score,
        boss_hp: gs.boss?.hp,
        boss_max_hp: gs.boss?.maxHp,
        chip_leader_phase: gs.boss?.chipLeaderPhase,
        one_outer_used: gs.boss?.oneOuterUsed,
        phase_transition_kind: ptKind,
        player_x: gs.player.x,
        player_y: gs.player.y,
        enemy_bullets_count: gs.enemyBullets.length,
        chip_particles_count: gs.chipParticles?.length ?? 0,
        fps_frame: w.__fpsFrame ?? 0,
      });
    }, 100);
  }, persona);
}

// 終了条件待機: タイムアウト or screen が clear/gameover/royalClear に到達
// Note: page.waitForFunction(fn, arg, options) — 第 2 引数は arg、options は第 3 引数。
// 引数順を間違えると default 30s timeout が適用される (既知バグで 1 度発覚)。
export async function waitUntilEnded(page: Page, persona: Persona): Promise<void> {
  const timeoutMs = persona.attention_span_s * 1000;
  await page.waitForFunction(
    () => {
      const w = window as Window & { __qaEnded?: boolean };
      return w.__qaEnded === true;
    },
    undefined,
    { timeout: timeoutMs, polling: 500 }
  ).catch(() => { /* timeout = end of attention span */ });
}

export async function harvestArtifacts(page: Page): Promise<RunArtifacts> {
  return await page.evaluate(() => {
    const w = window as Window & {
      __qaSnapshots?: Array<Record<string, unknown>>;
      __qaStartMs?: number;
      __qaFirstInputMs?: number | null;
      __qaPhaseTransitions?: Array<{ kind: string; t_ms: number; movement_post_px: number }>;
      __qaBehaviorId?: ReturnType<typeof setInterval>;
      __qaSnapshotId?: ReturnType<typeof setInterval>;
    };
    if (w.__qaBehaviorId) clearInterval(w.__qaBehaviorId);
    if (w.__qaSnapshotId) clearInterval(w.__qaSnapshotId);
    return {
      snapshots: (w.__qaSnapshots ?? []) as unknown as import("./types").FrameSnapshot[],
      start_ms: w.__qaStartMs ?? 0,
      initial_input_latency_ms: w.__qaFirstInputMs ?? null,
      phase_transitions: (w.__qaPhaseTransitions ?? []).map((t) => ({
        kind: t.kind,
        t_ms: t.t_ms,
        movement_post_ms: t.movement_post_px,  // px 値を再利用
      })),
    };
  });
}
