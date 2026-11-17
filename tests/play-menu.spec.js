// The four games live behind one "Play" pill, so the header stays a single tidy row.
const { test, expect } = require('@playwright/test');

test('the Play pill opens and closes the games menu', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?date=2026-12-24');
  await expect(page.locator('body')).toHaveClass(/ready/, { timeout: 60_000 });
  const play = page.getByRole('button', { name: '✦ Play' }), menu = page.locator('#games');
  await expect(menu).toBeHidden();
  await play.click();
  await expect(menu).toBeVisible();
  await expect(play).toHaveAttribute('aria-expanded', 'true');
  for (const name of [/fly the sleigh/i, /george swings/i, /carol of the doors/i, /friends’ concert/i]) await expect(menu.getByRole('button', { name })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await play.click();
  await menu.getByRole('button', { name: /carol of the doors/i }).click();
  await expect(menu).toBeHidden();
  await expect(page.locator('body')).toHaveClass(/carol/, { timeout: 20_000 });
  expect(errors).toEqual([]);
});
