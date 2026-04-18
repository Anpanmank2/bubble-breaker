import { test, expect } from "@playwright/test";

// C-4: Coupon UI happy path — force FOUR on Stage 4 -> CHAMPION -> issue coupon in UI.
// The button lives in ClearScreen <LStepCouponPanel>. After clicking, the code element
// should render with BB-2026-XXXXXXXX format and the LIFF link should be https://.
test("C-4 CHAMPION -> issue coupon -> code + liff url rendered in UI", async ({ page }) => {
  await page.goto("/?stage=4&test=four&quick=1");
  await page.getByTestId("btn-entry").click();

  await expect(page.getByTestId("btn-fight-boss")).toBeVisible({ timeout: 20_000 });
  await page.getByTestId("btn-fight-boss").click();

  await expect(page.locator(".champion-title")).toBeVisible({ timeout: 50_000 });

  // Issue coupon via UI (not direct API)
  await page.getByTestId("btn-issue-coupon").click();

  const codeEl = page.getByTestId("coupon-code");
  await expect(codeEl).toBeVisible({ timeout: 15_000 });
  await expect(codeEl).toContainText(/BB-2026-[A-F0-9]{8}/);

  const liff = page.getByTestId("btn-coupon-liff");
  await expect(liff).toBeVisible();
  const href = await liff.getAttribute("href");
  expect(href).toMatch(/^https:\/\//);
});
