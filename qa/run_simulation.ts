// Phase 6 QA: 20 ペルソナ × 3 runs = 60 plays を Playwright で自動実行
// 使用: npx tsx qa/run_simulation.ts [--url URL] [--parallel N]
// 出力: qa/reports/<date>/{runs.jsonl, summary.md, clear-rate.md} + qa/videos/<persona>/<run>.webm

import { chromium, Browser, BrowserContext } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { PERSONAS, RUNS_PER_PERSONA } from "./personas";
import { injectBehavior, waitUntilEnded, harvestArtifacts, RunArtifacts } from "./behavior";
import type { Persona, RunResult, FrameSnapshot } from "./types";
import { summarize } from "./summarize";

// Local dev に対して QA 実行 (production bundle は IS_PRODUCTION DCE で window.__gs が消失するため
// behavior 観測不可。`npm run dev` を別 terminal で起動してから本スクリプトを実行)
const URL_DEFAULT = process.env.QA_URL ?? "http://localhost:3000/?debug=1";
const PARALLEL = parseInt(process.env.QA_PARALLEL ?? "3", 10);

function parseArgs(): { url: string; parallel: number } {
  const args = process.argv.slice(2);
  let url = URL_DEFAULT;
  let parallel = PARALLEL;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && args[i+1]) { url = args[++i]; }
    if (args[i] === "--parallel" && args[i+1]) { parallel = parseInt(args[++i], 10); }
  }
  return { url, parallel };
}

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeRunResult(persona: Persona, runIndex: number, artifacts: RunArtifacts): RunResult {
  const snaps = artifacts.snapshots;
  const last = snaps[snaps.length - 1];
  const finalScreen = last?.screen ?? "unknown";

  const stagesReached = new Set(snaps.map((s: FrameSnapshot) => s.stage));
  const max_stage_reached = Math.max(1, ...Array.from(stagesReached));

  const chip_leader_phases_reached = Array.from(
    new Set(
      snaps
        .filter((s: FrameSnapshot) => s.stage === 4 && s.chip_leader_phase !== undefined)
        .map((s: FrameSnapshot) => s.chip_leader_phase as 1 | 2 | 3)
    )
  ).sort();

  const one_outer_fired = snaps.some((s: FrameSnapshot) => s.stage === 3 && s.one_outer_used === true);

  const livesLost = 3 - (last?.lives ?? 3);

  // FPS analysis
  const fpsDeltas: number[] = [];
  for (let i = 1; i < snaps.length; i++) {
    const dt = (snaps[i].t_ms - snaps[i-1].t_ms) / 1000;
    const df = snaps[i].fps_frame - snaps[i-1].fps_frame;
    if (dt > 0 && df >= 0 && dt < 0.5) fpsDeltas.push(df / dt);
  }
  const fps_avg = fpsDeltas.length > 0 ? fpsDeltas.reduce((a, b) => a + b, 0) / fpsDeltas.length : null;
  const fps_p5 = fpsDeltas.length >= 20 ? [...fpsDeltas].sort((a, b) => a - b)[Math.floor(fpsDeltas.length * 0.05)] : null;

  // Outcome
  let outcome: RunResult["outcome"];
  let boss_killed = false;
  if (finalScreen === "royalClear") { outcome = "royalClear"; boss_killed = true; }
  else if (finalScreen === "clear") { outcome = "clear"; boss_killed = true; }
  else if (finalScreen === "gameover") { outcome = "gameover"; }
  else { outcome = "timeout"; }

  // Decor proximity (rough heuristic: player x in 380-460 range = right edge decor zone)
  const decor_proximity_count = snaps.filter((s: FrameSnapshot) => s.player_x > 380).length;

  // Dialog visible pause (approximate: when enemy_bullets stops decreasing while player not moving)
  // skip for now, set 0 — too noisy without dom inspection
  const dialog_visible_pause_count = 0;

  return {
    persona_nickname: persona.nickname,
    archetype: persona.archetype,
    run_index: runIndex,
    duration_ms: last?.t_ms ?? 0,
    outcome,
    final_screen: finalScreen,
    max_stage_reached,
    boss_killed,
    chip_leader_phases_reached,
    one_outer_fired,
    lives_lost: livesLost,
    fps_avg,
    fps_p5,
    initial_input_latency_ms: artifacts.initial_input_latency_ms,
    phase_transition_reactions: artifacts.phase_transitions.map((t) => ({
      kind: t.kind,
      t_ms: t.t_ms,
      movement_post_ms: t.movement_post_ms,
    })),
    decor_proximity_count,
    dialog_visible_pause_count,
    notes: [],
  };
}

async function runOnce(
  browser: Browser,
  persona: Persona,
  runIndex: number,
  url: string,
  videoDir: string
): Promise<RunResult> {
  const ctx: BrowserContext = await browser.newContext({
    viewport: { width: 480, height: 720 },
    recordVideo: { dir: videoDir, size: { width: 480, height: 720 } },
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "load" });
    // React hydration 完了 + ENTRY ボタン表示まで待機
    await page.waitForSelector('[data-testid="btn-entry"]', { timeout: 15_000 });
    await injectBehavior(page, persona);
    await waitUntilEnded(page, persona);
    // final state snapshot を確実にキャプチャするため 300ms 追加待機
    await page.waitForTimeout(300);
    const artifacts = await harvestArtifacts(page);
    const result = computeRunResult(persona, runIndex, artifacts);
    return result;
  } finally {
    await ctx.close();  // flush video
  }
}

async function main() {
  const { url, parallel } = parseArgs();
  const dateStr = todayDateStr();
  const reportDir = path.join("qa", "reports", `${dateStr}-sprint-3-phase-6`);
  const videoBaseDir = path.join("qa", "videos", `${dateStr}-sprint-3-phase-6`);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(videoBaseDir, { recursive: true });

  console.log(`[QA] target URL: ${url}`);
  console.log(`[QA] parallelism: ${parallel}`);
  console.log(`[QA] runs: ${PERSONAS.length} personas × ${RUNS_PER_PERSONA} = ${PERSONAS.length * RUNS_PER_PERSONA}`);
  console.log(`[QA] output: ${reportDir}/`);

  const browser = await chromium.launch({ headless: true });

  // Build full task list (persona, runIndex)
  // Smoke test mode: QA_LIMIT_PERSONAS=N で先頭 N 体のみ、QA_LIMIT_RUNS=M で各 M run のみ
  const limitPersonas = parseInt(process.env.QA_LIMIT_PERSONAS ?? String(PERSONAS.length), 10);
  const limitRuns = parseInt(process.env.QA_LIMIT_RUNS ?? String(RUNS_PER_PERSONA), 10);
  const personasToRun = PERSONAS.slice(0, limitPersonas);
  const tasks: Array<{ persona: Persona; runIndex: number }> = [];
  for (const persona of personasToRun) {
    for (let i = 0; i < limitRuns; i++) {
      tasks.push({ persona, runIndex: i });
    }
  }

  const runsPath = path.join(reportDir, "runs.jsonl");
  const fd = fs.openSync(runsPath, "w");

  let completed = 0;
  const total = tasks.length;
  const inFlight = new Map<number, Promise<void>>();
  let nextTaskId = 0;

  const startNext = (): boolean => {
    if (nextTaskId >= tasks.length) return false;
    const id = nextTaskId++;
    const t = tasks[id];
    const videoDir = path.join(videoBaseDir, t.persona.nickname);
    fs.mkdirSync(videoDir, { recursive: true });
    const promise = (async () => {
      const start = Date.now();
      try {
        const result = await runOnce(browser, t.persona, t.runIndex, url, videoDir);
        fs.writeSync(fd, JSON.stringify(result) + "\n");
        completed++;
        console.log(`[${completed}/${total}] ${t.persona.nickname} run ${t.runIndex}: ${result.outcome} stage=${result.max_stage_reached} (${Date.now() - start}ms)`);
      } catch (err) {
        console.error(`[FAIL] ${t.persona.nickname} run ${t.runIndex}:`, err);
      } finally {
        inFlight.delete(id);
      }
    })();
    inFlight.set(id, promise);
    return true;
  };

  // Bootstrap parallel slots
  for (let i = 0; i < parallel; i++) startNext();

  // Drain
  while (inFlight.size > 0) {
    await Promise.race(inFlight.values());
    while (inFlight.size < parallel && startNext()) { /* fill */ }
  }

  fs.closeSync(fd);
  await browser.close();

  // Aggregate + write summary.md / clear-rate.md
  console.log(`[QA] aggregating results...`);
  await summarize(reportDir);
  console.log(`[QA] DONE. Report: ${reportDir}/summary.md`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
