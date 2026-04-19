import * as fs from "node:fs";
import * as path from "node:path";
import type { RunResult, Archetype, AggregateMetrics } from "./types";

function loadRuns(reportDir: string): RunResult[] {
  const p = path.join(reportDir, "runs.jsonl");
  const txt = fs.readFileSync(p, "utf-8");
  return txt.split("\n").filter((l) => l.trim().length > 0).map((l) => JSON.parse(l) as RunResult);
}

function aggregate(runs: RunResult[]): AggregateMetrics {
  const total = runs.length;
  const cleared = runs.filter((r) => r.outcome === "clear" || r.outcome === "royalClear");
  const stage4Reached = runs.filter((r) => r.max_stage_reached >= 4);
  const stage4Killed = stage4Reached.filter((r) => r.boss_killed);

  const clearByArch: Record<Archetype, { total: number; cleared: number }> = {
    "Casual": { total: 0, cleared: 0 },
    "Experienced": { total: 0, cleared: 0 },
    "Min-Maxer": { total: 0, cleared: 0 },
    "Explorer": { total: 0, cleared: 0 },
    "Speed-runner": { total: 0, cleared: 0 },
  };
  for (const r of runs) {
    clearByArch[r.archetype].total++;
    if (r.outcome === "clear" || r.outcome === "royalClear") clearByArch[r.archetype].cleared++;
  }

  const clearByPersona: Record<string, number> = {};
  const personaRuns: Record<string, RunResult[]> = {};
  for (const r of runs) {
    (personaRuns[r.persona_nickname] ||= []).push(r);
  }
  for (const [name, rr] of Object.entries(personaRuns)) {
    const c = rr.filter((r) => r.outcome === "clear" || r.outcome === "royalClear").length;
    clearByPersona[name] = c / rr.length;
  }

  const phase2Runs = runs.filter((r) => r.chip_leader_phases_reached.includes(2));
  const phase3Runs = runs.filter((r) => r.chip_leader_phases_reached.includes(3));

  const stage4Durations = stage4Killed.map((r) => r.duration_ms).filter((d) => d > 0);
  const avgKillDur = stage4Durations.length > 0 ? stage4Durations.reduce((a, b) => a + b, 0) / stage4Durations.length : null;

  const oneOuterEligible = runs.filter((r) => r.max_stage_reached >= 3);
  const oneOuterFired = oneOuterEligible.filter((r) => r.one_outer_fired);

  const livesLostStage4 = stage4Reached.map((r) => r.lives_lost);
  const avgLivesLostStage4 = livesLostStage4.length > 0 ? livesLostStage4.reduce((a, b) => a + b, 0) / livesLostStage4.length : 0;

  const fpsRunsAbove50 = runs.filter((r) => r.fps_p5 !== null && r.fps_p5 >= 50);

  return {
    total_runs: total,
    clear_rate: {
      overall: cleared.length / total,
      by_archetype: Object.fromEntries(
        Object.entries(clearByArch).map(([a, v]) => [a, v.total === 0 ? 0 : v.cleared / v.total])
      ) as Record<Archetype, number>,
      by_persona: clearByPersona,
    },
    stage4_reach_rate: stage4Reached.length / total,
    stage4_kill_rate: stage4Reached.length > 0 ? stage4Killed.length / stage4Reached.length : 0,
    avg_kill_duration_ms: avgKillDur,
    one_outer_fire_rate: oneOuterEligible.length > 0 ? oneOuterFired.length / oneOuterEligible.length : 0,
    phase_2_reach_rate: stage4Reached.length > 0 ? phase2Runs.length / stage4Reached.length : 0,
    phase_3_reach_rate: stage4Reached.length > 0 ? phase3Runs.length / stage4Reached.length : 0,
    avg_lives_lost_stage4: avgLivesLostStage4,
    fps_p95_above_50_rate: fpsRunsAbove50.length / total,
  };
}

function writeSummaryMd(reportDir: string, runs: RunResult[], agg: AggregateMetrics): void {
  const md: string[] = [];
  md.push(`# Sprint 2 Phase 6 QA — Summary Report`);
  md.push(``);
  md.push(`**生成**: ${new Date().toISOString()}`);
  md.push(`**Total runs**: ${agg.total_runs}`);
  md.push(`**Personas**: ${Object.keys(agg.clear_rate.by_persona).length}`);
  md.push(``);
  md.push(`## 軸 A: 難易度想定通り検証`);
  md.push(``);
  md.push(`| メトリクス | 想定値 | 実測 | 乖離 |`);
  md.push(`|----------|-------|------|-----|`);
  md.push(`| 母集団総合クリア率 | 20-35% | **${(agg.clear_rate.overall*100).toFixed(1)}%** | ${diffStr(agg.clear_rate.overall, 0.20, 0.35)} |`);
  md.push(`| Stage 4 到達率 | 80-90% | ${(agg.stage4_reach_rate*100).toFixed(1)}% | ${diffStr(agg.stage4_reach_rate, 0.80, 0.90)} |`);
  md.push(`| Stage 4 ボス撃破率 (到達者中) | 25-40% | ${(agg.stage4_kill_rate*100).toFixed(1)}% | ${diffStr(agg.stage4_kill_rate, 0.25, 0.40)} |`);
  md.push(`| Phase 1→2 通過率 | 90%+ | ${(agg.phase_2_reach_rate*100).toFixed(1)}% | ${agg.phase_2_reach_rate >= 0.90 ? "OK" : "LOW"} |`);
  md.push(`| Phase 2→3 通過率 | 30-50% | ${(agg.phase_3_reach_rate*100).toFixed(1)}% | ${diffStr(agg.phase_3_reach_rate, 0.30, 0.50)} |`);
  md.push(`| Stage 4 平均ボス撃破時間 | 60-75 秒 | ${agg.avg_kill_duration_ms ? (agg.avg_kill_duration_ms/1000).toFixed(1)+"s" : "n/a"} | ${agg.avg_kill_duration_ms ? diffStr(agg.avg_kill_duration_ms/1000, 60, 75) : "n/a"} |`);
  md.push(`| ワンアウター発火率 (Stage 3 到達者中) | 95%+ | ${(agg.one_outer_fire_rate*100).toFixed(1)}% | ${agg.one_outer_fire_rate >= 0.95 ? "OK" : "LOW"} |`);
  md.push(`| Stage 4 平均ライフ消費 | 1.5/3 | ${agg.avg_lives_lost_stage4.toFixed(2)} | ${diffStr(agg.avg_lives_lost_stage4, 1.0, 2.0)} |`);
  md.push(`| 60fps 維持率 (5pt > 50fps) | 95%+ | ${(agg.fps_p95_above_50_rate*100).toFixed(1)}% | ${agg.fps_p95_above_50_rate >= 0.95 ? "OK" : "LOW"} |`);
  md.push(``);

  md.push(`## クリア率 (アーキタイプ別)`);
  md.push(``);
  md.push(`| アーキタイプ | runs | クリア数 | クリア率 | 想定 |`);
  md.push(`|------------|------|---------|---------|------|`);
  const expected: Record<Archetype, [number, number]> = {
    "Casual": [0, 0],
    "Experienced": [0.20, 0.40],
    "Min-Maxer": [0.60, 0.80],
    "Explorer": [0, 0.20],  // 実装後の経験値
    "Speed-runner": [0.80, 1.00],
  };
  for (const [arch, rate] of Object.entries(agg.clear_rate.by_archetype)) {
    const archRuns = runs.filter((r) => r.archetype === arch as Archetype);
    const cleared = archRuns.filter((r) => r.outcome === "clear" || r.outcome === "royalClear").length;
    const exp = expected[arch as Archetype];
    md.push(`| ${arch} | ${archRuns.length} | ${cleared} | **${(rate*100).toFixed(1)}%** | ${(exp[0]*100).toFixed(0)}-${(exp[1]*100).toFixed(0)}% |`);
  }
  md.push(``);

  md.push(`## 軸 B: 直感理解検証`);
  md.push(``);
  const initialLatencies = runs.map((r) => r.initial_input_latency_ms).filter((v): v is number => v !== null);
  const avgInitLatency = initialLatencies.length > 0 ? initialLatencies.reduce((a, b) => a + b, 0) / initialLatencies.length : null;
  md.push(`- 操作開始までの平均レイテンシ: ${avgInitLatency ? avgInitLatency.toFixed(0) + "ms" : "n/a"} (想定 5000ms 以内)`);
  const allTransitions = runs.flatMap((r) => r.phase_transition_reactions);
  const avgMovementPostTransition = allTransitions.length > 0
    ? allTransitions.reduce((a, b) => a + b.movement_post_ms, 0) / allTransitions.length
    : 0;
  md.push(`- Phase 転換後 1s 内の平均移動量: ${avgMovementPostTransition.toFixed(1)}px (高いほど反応している)`);
  md.push(``);

  md.push(`## 軸 C: 機能必要性検証`);
  md.push(``);
  const totalDecorProx = runs.reduce((a, r) => a + r.decor_proximity_count, 0);
  md.push(`- 背景装飾エリア (右端) への接近カウント合計: ${totalDecorProx} snapshots`);
  md.push(`- 平均/run: ${(totalDecorProx / runs.length).toFixed(1)} snapshots`);
  md.push(``);
  md.push(`## アウトカム分布`);
  md.push(``);
  const outcomes = { clear: 0, royalClear: 0, gameover: 0, timeout: 0 };
  for (const r of runs) outcomes[r.outcome]++;
  for (const [k, v] of Object.entries(outcomes)) {
    md.push(`- ${k}: ${v} (${((v / runs.length)*100).toFixed(1)}%)`);
  }
  md.push(``);

  md.push(`## Sprint 2 結論`);
  md.push(``);
  const overallVerdict = (() => {
    const okClear = agg.clear_rate.overall >= 0.10 && agg.clear_rate.overall <= 0.45;
    const okFps = agg.fps_p95_above_50_rate >= 0.90;
    return okClear && okFps ? "想定範囲内" : "想定外 — Audit 3 で詳細分析必要";
  })();
  md.push(`総合判定: **${overallVerdict}**`);
  md.push(``);
  md.push(`次フェーズ: Audit 3 (res-07 マーカス) で乖離項目を統計的に検証 → Sprint 3 計画反映`);

  fs.writeFileSync(path.join(reportDir, "summary.md"), md.join("\n"));
}

function writeClearRateMd(reportDir: string, runs: RunResult[], agg: AggregateMetrics): void {
  const md: string[] = [];
  md.push(`# Sprint 2 Phase 6 — クリア率特化レポート`);
  md.push(``);
  md.push(`Owner 直下の最重要指標。母集団 + 個人 + アーキタイプ 3 視点で集計。`);
  md.push(``);
  md.push(`## 母集団クリア率 (60 runs ベース)`);
  md.push(``);
  md.push(`| 指標 | 値 |`);
  md.push(`|------|----|`);
  md.push(`| Total runs | ${agg.total_runs} |`);
  md.push(`| クリア (clear + royalClear) | ${runs.filter((r) => r.outcome === "clear" || r.outcome === "royalClear").length} |`);
  md.push(`| クリア率 | **${(agg.clear_rate.overall*100).toFixed(2)}%** |`);
  md.push(`| 想定値 | 20-35% (Stage 4 到達 80-90% × 撃破 25-40%) |`);
  md.push(`| 乖離判定 | ${diffStr(agg.clear_rate.overall, 0.20, 0.35)} |`);
  md.push(``);

  md.push(`## アーキタイプ別クリア率`);
  md.push(``);
  md.push(`| アーキタイプ | runs | クリア | クリア率 | 想定 | 判定 |`);
  md.push(`|------------|------|-------|---------|------|------|`);
  const expected: Record<Archetype, [number, number]> = {
    "Casual": [0, 0],
    "Experienced": [0.20, 0.40],
    "Min-Maxer": [0.60, 0.80],
    "Explorer": [0, 0.20],
    "Speed-runner": [0.80, 1.00],
  };
  for (const arch of ["Casual", "Experienced", "Min-Maxer", "Explorer", "Speed-runner"] as Archetype[]) {
    const archRuns = runs.filter((r) => r.archetype === arch);
    const cleared = archRuns.filter((r) => r.outcome === "clear" || r.outcome === "royalClear").length;
    const rate = archRuns.length > 0 ? cleared / archRuns.length : 0;
    const exp = expected[arch];
    const judge = rate >= exp[0] && rate <= exp[1] ? "✓" : "✗";
    md.push(`| ${arch} | ${archRuns.length} | ${cleared} | **${(rate*100).toFixed(1)}%** | ${(exp[0]*100).toFixed(0)}-${(exp[1]*100).toFixed(0)}% | ${judge} |`);
  }
  md.push(``);

  md.push(`## 個人クリア率 (3 runs / persona)`);
  md.push(``);
  md.push(`| persona | archetype | クリア数 / 3 | クリア率 |`);
  md.push(`|---------|-----------|-------------|---------|`);
  for (const [name, rate] of Object.entries(agg.clear_rate.by_persona).sort((a, b) => b[1] - a[1])) {
    const personaRuns = runs.filter((r) => r.persona_nickname === name);
    const arch = personaRuns[0]?.archetype ?? "?";
    const cleared = personaRuns.filter((r) => r.outcome === "clear" || r.outcome === "royalClear").length;
    md.push(`| ${name} | ${arch} | ${cleared}/${personaRuns.length} | ${(rate*100).toFixed(0)}% |`);
  }
  md.push(``);

  md.push(`## 死亡分布`);
  md.push(``);
  md.push(`| 到達 stage | runs |`);
  md.push(`|----------|------|`);
  for (const stage of [1, 2, 3, 4]) {
    const c = runs.filter((r) => r.max_stage_reached === stage).length;
    md.push(`| Stage ${stage} | ${c} |`);
  }
  md.push(``);
  md.push(`### Owner 観点`);
  md.push(``);
  md.push(`- 「想定通りか?」 → 母集団クリア率 ${(agg.clear_rate.overall*100).toFixed(1)}% vs 想定 20-35%: ${diffStr(agg.clear_rate.overall, 0.20, 0.35)}`);
  md.push(`- 「直感理解できているか?」 → アーキタイプ別判定の Casual:0% / Experienced:中 / Min-Maxer:高 のグラデーションが期待通りか確認`);
  md.push(`- 「いらない機能は?」 → summary.md の軸 C 値 + Audit 3 の Game Designer 視点レビュー`);

  fs.writeFileSync(path.join(reportDir, "clear-rate.md"), md.join("\n"));
}

function diffStr(actual: number, expMin: number, expMax: number): string {
  if (actual >= expMin && actual <= expMax) return "✓ 想定内";
  if (actual < expMin) return `✗ 低 (-${((expMin - actual)*100).toFixed(1)}pp)`;
  return `✗ 高 (+${((actual - expMax)*100).toFixed(1)}pp)`;
}

export async function summarize(reportDir: string): Promise<void> {
  const runs = loadRuns(reportDir);
  const agg = aggregate(runs);
  writeSummaryMd(reportDir, runs, agg);
  writeClearRateMd(reportDir, runs, agg);
  fs.writeFileSync(path.join(reportDir, "aggregate.json"), JSON.stringify(agg, null, 2));
}

// CLI usage: npx tsx qa/summarize.ts <reportDir>
if (require.main === module) {
  const reportDir = process.argv[2];
  if (!reportDir) {
    console.error("Usage: npx tsx qa/summarize.ts <reportDir>");
    process.exit(1);
  }
  summarize(reportDir).then(() => console.log(`Done: ${reportDir}/summary.md`));
}
