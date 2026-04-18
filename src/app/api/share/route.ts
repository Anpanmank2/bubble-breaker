import { NextResponse } from "next/server";
import { getKv } from "@/lib/kv/client";

export const runtime = "nodejs";

export async function POST() {
  try {
    const kv = await getKv();
    const count = await kv.incr("share:counter");
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error("[share] KV write failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
