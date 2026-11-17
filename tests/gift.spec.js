// "Make it a gift": a giver writes notes, gets a link, and the recipient finds each note behind its door.
const { test, expect } = require('@playwright/test');

test('a gift link survives the round trip, notes and all', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?date=2026-12-24');
  await expect(page.locator('body')).toHaveClass(/ready/, { timeout: 60_000 });

  await page.click('#gift-btn');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name=to]').fill('Mia');
  await dialog.locator('input[name=from]').fill('Love, Grandma');
  await dialog.locator('textarea[name=n1]').fill('Look under your pillow 🎄');
  await dialog.locator('textarea[name=n24]').fill('Sleep tight.\nHe’s on his way! ✨ «ñ»');
  await dialog.getByRole('button', { name: /create the gift link/i }).click();
  await expect(dialog.locator('input[name=link]')).toHaveValue(/#gift=1[\w-]+$/);
  const link = await dialog.locator('input[name=link]').inputValue();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  const hash = new URL(link).hash;
  await page.goto(`/?date=2026-12-24&open=24${hash}`);
  await expect(page.locator('#h1')).toHaveText('An Advent House for Mia');
  await expect(page.locator('body')).toHaveClass(/day/, { timeout: 60_000 });
  await expect(page.locator('#note')).toBeVisible();
  await expect(page.locator('#note-text')).toHaveText('Sleep tight.\nHe’s on his way! ✨ «ñ»', { useInnerText: false });
  await expect(page.locator('#note-from')).toHaveText('— Love, Grandma');

  // a door left blank keeps only its usual story
  await page.goto(`/?date=2026-12-24&open=2${hash}`);
  await expect(page.locator('body')).toHaveClass(/day/, { timeout: 60_000 });
  await expect(page.locator('#note')).toBeHidden();

  // each gift keeps its own progress, apart from your own calendar (?click opens the door for real, which saves)
  await page.goto(`/?date=2026-12-24&click=3${hash}`);
  const giftKey = () => page.evaluate(() => Object.keys(localStorage).find((k) => /^advent-\d{4}-gift-\w+-preview$/.test(k)) ?? null);
  await expect.poll(giftKey, { timeout: 120_000 }).not.toBeNull();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).not.toContain('advent-2026-preview');
  expect(errors).toEqual([]);
});

test('a broken gift link falls back to the ordinary house', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?date=2026-12-24&open=1#gift=1not-a-real-gift');
  await expect(page.locator('body')).toHaveClass(/day/, { timeout: 60_000 });
  await expect(page.locator('#h1')).toHaveText('The Advent House');
  await expect(page.locator('#note')).toBeHidden();
  expect(errors).toEqual([]);
});
