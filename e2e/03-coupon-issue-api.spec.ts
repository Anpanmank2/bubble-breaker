import { test, expect } from "@playwright/test";

test("/api/coupons/issue returns a code + liffUrl", async ({ request }) => {
  const res = await request.post("/api/coupons/issue", {
    data: {
      runId: "smoke-test",
      score: 1234,
      bestHand: "ROYAL_FLUSH",
      endedStage: 4,
      endedReason: "royal",
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.code).toMatch(/^BB-2026-[A-F0-9]{8}$/);
  expect(body.liffUrl).toMatch(/^https:\/\//);
  expect(body.liffUrl).toContain(encodeURIComponent(body.code));
});
