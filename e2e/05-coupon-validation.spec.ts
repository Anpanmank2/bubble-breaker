import { test, expect } from "@playwright/test";

test("rejects invalid endedStage", async ({ request }) => {
  const res = await request.post("/api/coupons/issue", {
    data: { runId: "x", score: 100, bestHand: "PAIR", endedStage: 999, endedReason: "cleared" },
  });
  expect(res.status()).toBe(400);
});

test("rejects negative score", async ({ request }) => {
  const res = await request.post("/api/coupons/issue", {
    data: { runId: "x", score: -1, bestHand: "PAIR", endedStage: 2, endedReason: "cleared" },
  });
  expect(res.status()).toBe(400);
});

test("rejects unknown endedReason", async ({ request }) => {
  const res = await request.post("/api/coupons/issue", {
    data: { runId: "x", score: 100, bestHand: "PAIR", endedStage: 2, endedReason: "hacked" },
  });
  expect(res.status()).toBe(400);
});

test("rejects missing/empty bestHand", async ({ request }) => {
  const res = await request.post("/api/coupons/issue", {
    data: { runId: "x", score: 100, bestHand: "", endedStage: 2, endedReason: "cleared" },
  });
  expect(res.status()).toBe(400);
});
