import { getKv } from "./client";

export type CouponRecord = {
  code: string;
  runId: string;
  issuedAt: string;
  endedStage: 1 | 2 | 3 | 4;
  endedReason: "cleared" | "royal";
  bestHand: string;
  score: number;
  redeemed: boolean;
};

const TTL_SECONDS = 30 * 24 * 60 * 60;

export async function issueCouponAtomic(record: CouponRecord): Promise<boolean> {
  const kv = await getKv();
  const r = await kv.set(`coupon:${record.code}`, record, { ex: TTL_SECONDS, nx: true });
  return r === "OK";
}

export async function getCoupon(code: string): Promise<CouponRecord | null> {
  const kv = await getKv();
  return kv.get<CouponRecord>(`coupon:${code}`);
}
