// Runs the house's own ?selftest: all 24 scenes rendered at several moments, every hidden star
// shown and collected, every song checked, and the whole concert programme played through.
const { test, expect } = require('@playwright/test');

test('built-in selftest passes for every door', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?selftest&date=2026-12-24&q=0');
  const out = page.locator('#selftest');
  await expect(out).toHaveText(/^SELFTEST /, { timeout: 200_000 });
  const r = JSON.parse((await out.textContent()).slice('SELFTEST '.length));
  expect(r.scenes).toBe('all 24 ok');
  expect(r.stars).toBe('all 24 stars ok');
  expect(r.songs).toEqual([]);
  expect(r.band).toBe('all 25 carols ok');
  expect(r.errors).toEqual([]);
  expect(errors).toEqual([]);
});

test('the house loads, with door scenes that open cleanly', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?date=2026-12-24');
  await expect(page.locator('body')).toHaveClass(/ready/, { timeout: 60_000 });
  for (const n of [1, 16, 24]) {
    await page.goto(`/?date=2026-12-24&open=${n}`);
    await expect(page.locator('body')).toHaveClass(/day/, { timeout: 60_000 });
    await expect(page.locator('#num')).toHaveText(String(n));
    await expect(page.locator('#title')).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
});
