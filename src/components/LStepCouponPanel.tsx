"use client";

import { useState } from "react";
import { localStore } from "@/lib/storage/local";

type Props = {
  runId: string;
  endedStage: 1 | 2 | 3 | 4;
  endedReason: "cleared" | "royal";
  bestHand: string;
  score: number;
};

type CouponIssueResult = { code: string; liffUrl: string } | { error: string };

export function LStepCouponPanel({ runId, endedStage, endedReason, bestHand, score }: Props) {
  const [state, setState] = useState<"idle" | "issuing" | "ready" | "failed">(() =>
    localStore.hasAlreadyCleared() ? "ready" : "idle"
  );
  const [result, setResult] = useState<{ code: string; liffUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const issue = async () => {
    if (state === "issuing") return;
    setState("issuing");
    setError(null);
    try {
      const resp = await fetch("/api/coupons/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, score, bestHand, endedStage, endedReason }),
      });
      const body: CouponIssueResult = await resp.json();
      if (!resp.ok || "error" in body) {
        setError("error" in body ? body.error : `HTTP ${resp.status}`);
        setState("failed");
        return;
      }
      setResult(body);
      localStore.markCleared();
      setState("ready");
    } catch (e) {
      setError((e as Error).message);
      setState("failed");
    }
  };

  if (state === "idle") {
    return (
      <div className="coupon-panel">
        <button className="btn btn-gold" onClick={issue} data-testid="btn-issue-coupon">
          🎟 クーポンを発行する
        </button>
        <div className="coupon-hint">ドリンクチケット500円分が LINE で受け取れます</div>
      </div>
    );
  }

  if (state === "issuing") {
    return (
      <div className="coupon-panel">
        <div className="coupon-loading" data-testid="coupon-loading">発行中…</div>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="coupon-panel">
        <div className="coupon-error" data-testid="coupon-error">
          発行に失敗しました: {error}
        </div>
        <button className="btn btn-cyan" onClick={issue}>再試行</button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="coupon-panel">
        <div className="coupon-hint">既にクーポンを受け取り済みです</div>
      </div>
    );
  }

  return (
    <div className="coupon-panel">
      <div className="coupon-code" data-testid="coupon-code">
        クーポンコード: <code>{result.code}</code>
      </div>
      <a className="btn btn-line" href={result.liffUrl} target="_blank" rel="noopener noreferrer" data-testid="btn-coupon-liff">
        LINE で受け取る
      </a>
      <div className="coupon-hint">LINE アプリが開きます。JOPT 公式 LINE を友だち追加してください</div>
    </div>
  );
}
