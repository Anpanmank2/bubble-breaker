import { test, expect } from "@playwright/test";
import path from "node:path";

const PROD = "https://bubble-breaker-gules.vercel.app";

test.use({ baseURL: PROD });

test("prod title renders + ENTRY starts stage 1", async ({ page }) => {
  await page.goto(`/?t=${Date.now()}`);
  await expect(page.locator("h1.title-text")).toHaveText("BUBBLE BREAKER");
  await expect(page.getByTestId("btn-entry")).toBeVisible();
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("game-canvas")).toBeVisible();
});

test("prod forced royal reaches PERFECT CHAMPION (quick mode)", async ({ page }) => {
  await page.goto(`/?test=royal&quick=1&t=${Date.now()}`);
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("royal-clear")).toBeVisible({ timeout: 30_000 });
});

test("prod /api/coupons/issue returns code + LIFF url", async ({ request }) => {
  const res = await request.post(`${PROD}/api/coupons/issue`, {
    data: {
      runId: "prod-smoke",
      score: 1234,
      bestHand: "FOUR_KIND",
      endedStage: 4,
      endedReason: "cleared",
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.code).toMatch(/^BB-2026-[A-F0-9]{8}$/);
  expect(body.liffUrl).toMatch(/^https:\/\//);
});

test("prod 3VP screenshot artifact", async ({ page }, testInfo) => {
  await page.goto(`/?t=${Date.now()}`);
  await expect(page.getByTestId("btn-entry")).toBeVisible();
  const outDir = path.resolve(__dirname, "..", "smoke-screenshots");
  await page.screenshot({
    path: path.join(outDir, `prod-title-${testInfo.project.name}.png`),
    fullPage: true,
  });
});
