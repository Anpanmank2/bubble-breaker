// v2 Sprint 2: 演出時間とフォールバック制約の集中管理
// memory `feedback_time_compression_hooks.md` 準拠: URL param / env で上書き可能
// Owner 決定 2026-04-18: Phase 転換時間は藤井 AD 準拠

const DEFAULT_FX = {
  // Phase 転換テキスト表示時間 (ms)
  evenStackMs: 1000,      // ?evenStackMs で上書き
  chipLeadChangeMs: 1500, // ?chipLeadChangeMs
  allInChipMs: 800,       // ?allInChipMs (CHIP LEADER)
  allIn3BetMs: 600,       // ?allIn3BetMs (Stage 2 ボス)

  // サングラス吹っ飛びアニメ (ms)
  sunglassesMs: 1000,     // ?sunglassesMs

  // ワンアウター
  oneOuterThreshold: 0.25, // ?oneOuterThreshold (HP 比率、0-1)
  oneOuterHealAmount: 0.30, // ?oneOuterHealAmount (HP 回復率)
  oneOuterTextMs: 2000,    // ?oneOuterMs

  // スタックバー補間速度 (0-1、大きいほど速く追従)
  stackLerp: 0.15,        // ?stackLerp

  // 被弾無効時間 (Phase 転換中)
  phaseImmuneMs: 800,     // ?phaseImmuneMs
} as const;

export type FxConfig = typeof DEFAULT_FX;

/**
 * URL search params から FX 設定を読み取る
 * 指定なしはデフォルト値
 * ?fxDuration=X で全演出時間を一括上書き（デバッグ用）
 */
export function readFxConfig(search: string): FxConfig {
  const params = new URLSearchParams(search);
  const fxDurationOverride = params.get("fxDuration");
  const fxAll = fxDurationOverride !== null ? parseInt(fxDurationOverride, 10) : null;

  const readNum = (key: string, defaultValue: number, isFraction = false): number => {
    const v = params.get(key);
    if (v === null) {
      if (fxAll !== null && !isFraction) return fxAll;
      return defaultValue;
    }
    const n = parseFloat(v);
    return isNaN(n) ? defaultValue : n;
  };

  return {
    evenStackMs: readNum("evenStackMs", DEFAULT_FX.evenStackMs),
    chipLeadChangeMs: readNum("chipLeadChangeMs", DEFAULT_FX.chipLeadChangeMs),
    allInChipMs: readNum("allInChipMs", DEFAULT_FX.allInChipMs),
    allIn3BetMs: readNum("allIn3BetMs", DEFAULT_FX.allIn3BetMs),
    sunglassesMs: readNum("sunglassesMs", DEFAULT_FX.sunglassesMs),
    oneOuterThreshold: readNum("oneOuterThreshold", DEFAULT_FX.oneOuterThreshold, true),
    oneOuterHealAmount: readNum("oneOuterHealAmount", DEFAULT_FX.oneOuterHealAmount, true),
    oneOuterTextMs: readNum("oneOuterMs", DEFAULT_FX.oneOuterTextMs),
    stackLerp: readNum("stackLerp", DEFAULT_FX.stackLerp, true),
    phaseImmuneMs: readNum("phaseImmuneMs", DEFAULT_FX.phaseImmuneMs),
  };
}

/**
 * 低端末検出 (パーティクル数・エフェクト有効性の制御)
 * navigator.hardwareConcurrency が取れない環境（SSR 等）は false
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency;
  return typeof cores === "number" && cores <= 2;
}

export const FX_LIMITS = {
  chipParticlesNormalMax: 40,
  chipParticlesTransitionMax: 80,
  chipParticlesLowEndNormal: 20,
  chipParticlesLowEndTransition: 40,
  enemyBulletsMax: 120,
  enemyBulletsLowEndMax: 80,
} as const;
