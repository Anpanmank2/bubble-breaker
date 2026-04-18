import { StageConfig } from "./stageConfig";

export type EnemyType =
  | "limp" | "gaba" | "donk"
  | "tag" | "callstation" | "threebetter"
  | "gto" | "bluffcatch" | "slowplay";

export function stageEnemyTypes(sn: number): EnemyType[] {
  if (sn === 1) return ["limp", "gaba", "donk"];
  if (sn === 2) return ["tag", "callstation", "threebetter"];
  if (sn === 3) return ["gto", "bluffcatch", "slowplay"];
  return ["limp", "gaba", "tag", "callstation", "gto", "bluffcatch"];
}

export function getEnemyHp(type: EnemyType, cfg: StageConfig): number {
  const base: Record<EnemyType, number> = {
    limp: 1, gaba: 1, donk: 1,
    tag: 2, callstation: 4, threebetter: 2,
    gto: 3, bluffcatch: 2, slowplay: 2,
  };
  return (base[type] || 1) * cfg.enemyHp;
}

export function getEnemyColor(type: EnemyType): string {
  const colors: Record<EnemyType, string> = {
    limp: "#66bb6a", gaba: "#ffa726", donk: "#ef5350",
    tag: "#42a5f5", callstation: "#ab47bc", threebetter: "#ff7043",
    gto: "#26c6da", bluffcatch: "#ec407a", slowplay: "#78909c",
  };
  return colors[type] ?? "#888";
}

export function getEnemyLabel(type: EnemyType): string {
  const labels: Record<EnemyType, string> = {
    limp: "LIMP", gaba: "GABA", donk: "DONK",
    tag: "TAG", callstation: "CALL", threebetter: "3BET",
    gto: "GTO", bluffcatch: "CATCH", slowplay: "SLOW",
  };
  return labels[type] ?? "?";
}
