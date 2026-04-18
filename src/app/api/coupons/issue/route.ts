import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { issueCouponAtomic, CouponRecord } from "@/lib/kv/coupons";
import { buildLiffUrl } from "@/lib/lstep/buildLiffUrl";

export const runtime = "nodejs";

type IssueBody = {
  runId?: unknown;
  score?: unknown;
  bestHand?: unknown;
  endedStage?: unknown;
  endedReason?: unknown;
};

function validate(body: IssueBody): { ok: true; value: Omit<CouponRecord, "code" | "issuedAt" | "redeemed"> } | { ok: false; reason: string } {
  const runId = typeof body.runId === "string" && body.runId.length <= 64 ? body.runId : "anon";
  if (typeof body.score !== "number" || !Number.isFinite(body.score) || body.score < 0 || body.score > 1_000_000) {
    return { ok: false, reason: "INVALID_SCORE" };
  }
  if (typeof body.bestHand !== "string" || body.bestHand.length === 0 || body.bestHand.length > 32) {
    return { ok: false, reason: "INVALID_BEST_HAND" };
  }
  const stage = body.endedStage;
  if (stage !== 1 && stage !== 2 && stage !== 3 && stage !== 4) {
    return { ok: false, reason: "INVALID_ENDED_STAGE" };
  }
  if (body.endedReason !== "cleared" && body.endedReason !== "royal") {
    return { ok: false, reason: "INVALID_ENDED_REASON" };
  }
  return {
    ok: true,
    value: {
      runId,
      score: body.score,
      bestHand: body.bestHand,
      endedStage: stage,
      endedReason: body.endedReason,
    },
  };
}

export async function POST(req: NextRequest) {
  let body: IssueBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const v = validate(body);
  if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 400 });

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = `BB-2026-${randomBytes(4).toString("hex").toUpperCase()}`;
    const record: CouponRecord = {
      ...v.value,
      code,
      issuedAt: new Date().toISOString(),
      redeemed: false,
    };
    try {
      const wrote = await issueCouponAtomic(record);
      if (wrote) {
        return NextResponse.json({ code, liffUrl: buildLiffUrl(code) });
      }
    } catch (e) {
      console.error("[coupons/issue] KV write failed", e);
      return NextResponse.json({ error: "KV_WRITE_FAILED" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "CODE_COLLISION" }, { status: 500 });
}
