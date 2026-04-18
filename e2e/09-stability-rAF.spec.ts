import { test, expect } from "@playwright/test";

// C-5: 3-minute stability run — watch for console errors / pageerror during a long idle.
// Run on mobile-390 only (single-VP to keep total suite time manageable; rAF bugs are viewport-agnostic).
test("C-5 3-minute idle run on stage 1 produces zero JS errors", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "Run only once — rAF leak is viewport-agnostic.");
  test.setTimeout(240_000); // 4 minutes total budget

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      // Filter out favicon / 404-style network noise (app is bare, none expected).
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message + "\n" + (err.stack ?? ""));
  });

  await page.goto("/?stage=1&quick=1&debug=1");
  await page.getByTestId("btn-entry").click();
  await expect(page.getByTestId("game-canvas")).toBeVisible();

  // Loop for 180s. The game will bounce between collect/handReveal/boss/playing indefinitely
  // because we don't press FIGHT BOSS — so once handReveal shows, the rAF stops (by design:
  // loop exits when screenRef != "playing" && != "boss"). To keep rAF actually running,
  // we repeatedly click FIGHT BOSS when it appears, advancing through stages.
  const start = Date.now();
  while (Date.now() - start < 180_000) {
    // opportunistically click fight-boss if it is rendered (handReveal screen)
    const fight = page.getByTestId("btn-fight-boss");
    if (await fight.isVisible().catch(() => false)) {
      await fight.click().catch(() => {});
    }
    await page.waitForTimeout(2_000);
  }

  // No JS errors should have surfaced during the 3-min session.
  expect(pageErrors, pageErrors.join("\n---\n")).toEqual([]);
  expect(consoleErrors, consoleErrors.join("\n---\n")).toEqual([]);
});
