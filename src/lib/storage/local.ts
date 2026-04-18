const KEY_RUN_ID = "bb:lastRunId";
const KEY_HAS_CLEARED = "bb:hasCleared";

export const localStore = {
  saveRunId(runId: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY_RUN_ID, runId);
  },
  getLastRunId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEY_RUN_ID);
  },
  hasAlreadyCleared(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY_HAS_CLEARED) === "1";
  },
  markCleared() {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY_HAS_CLEARED, "1");
  },
};
