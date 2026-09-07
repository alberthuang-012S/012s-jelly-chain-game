import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY, defaultStats } from '../src/storage';

test('complete round, duplicate start prevention, skip, persisted results and settings', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/?debug=1');
  await expect(page.getByRole('gridcell')).toHaveCount(36);
  await page.getByRole('button', { name: 'FAST MODE' }).click();
  await page.getByRole('button', { name: 'SOUND OFF' }).click();
  await page.getByRole('button', { name: 'FORCE HIGH COMBO', exact: true }).click();
  await expect(page.getByTestId('plays')).toHaveText('09');
  await expect(page.getByRole('button', { name: 'EXPERIMENT IN PROGRESS' })).toBeDisabled();
  await page.getByRole('button', { name: 'SKIP ANIMATION' }).click();
  await expect(page.getByRole('dialog', { name: 'EXPERIMENT COMPLETE' })).toBeVisible();
  await expect(page.getByText('MAX COMBO', { exact: true })).toBeVisible();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
  expect(stored.stats.totalGames).toBe(1);
  expect(stored.stats.plays).toBe(9);
  expect(stored.stats.mockPoints).toBe(Math.floor(stored.stats.totalScore / 100));
  await page.getByRole('button', { name: 'CLOSE · 關閉' }).click();
  await expect(page.getByRole('button', { name: /START EXPERIMENT/ })).toBeEnabled();
  await page.reload();
  await expect(page.getByTestId('plays')).toHaveText('09');
  await expect(page.getByTestId('points')).toHaveText(stored.stats.mockPoints.toLocaleString());
  await expect(page.getByRole('button', { name: 'FAST MODE' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'SOUND ON' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(errors).toEqual([]);
});

for (const scenario of ['FIRE', 'WILD', 'BONUS', 'NO MATCH', 'LARGE CLUSTER']) {
  test(`${scenario} completes through the actual animation timeline`, async ({ page }) => {
    await page.goto('/?debug=1');
    await page.getByRole('button', { name: 'FAST MODE' }).click();
    await page.getByRole('button', { name: `FORCE ${scenario}`, exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'EXPERIMENT COMPLETE' })).toBeVisible({
      timeout: 65000,
    });
    await expect(page.getByTestId('plays')).toHaveText('09');
    if (scenario === 'NO MATCH') {
      await expect(page.getByText('Small reaction.')).toBeVisible();
      await expect(page.getByTestId('score')).toHaveText('0');
    }
    await page.getByRole('button', { name: 'CLOSE · 關閉' }).click();
    if (scenario === 'BONUS') {
      await page.getByRole('button', { name: /BONUS READY/ }).click();
      await expect(page.getByRole('dialog', { name: 'BONUS MODE' })).toBeVisible();
      await expect(page.getByText('Coming in Phase 2')).toBeVisible();
    }
  });
}

test('reward preview never deducts points; modal keyboard focus is trapped and restored', async ({
  page,
}) => {
  await page.goto('/?debug=1');
  await page.getByRole('button', { name: '+1000 MOCK POINTS', exact: true }).click();
  const opener = page.getByRole('button', { name: 'REWARD SHOP', exact: true });
  await opener.click();
  await expect(page.getByRole('dialog', { name: 'REWARD SHOP' })).toBeVisible();
  await page.getByRole('button', { name: 'REDEEM $50 優惠券', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('沒有扣除點數');
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.getByTestId('points')).toHaveText('1,000');
});

test('zero plays, corrupt data recovery, hidden debug and reload during playback', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('LAB DEBUG', { exact: false })).toHaveCount(0);
  await page.evaluate(
    ({ key, stats }) => localStorage.setItem(key, JSON.stringify({ version: 1, stats })),
    { key: STORAGE_KEY, stats: { ...defaultStats(), plays: 0 } },
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'NO PLAY LEFT', exact: true })).toBeDisabled();
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), STORAGE_KEY);
  await page.reload();
  await expect(page.getByTestId('plays')).toHaveText('10');
  await page.getByRole('button', { name: /START EXPERIMENT/ }).click();
  await expect(page.getByTestId('plays')).toHaveText('09');
  await page.reload();
  await expect(page.getByTestId('plays')).toHaveText('09');
  await expect(page.getByRole('button', { name: /START EXPERIMENT/ })).toBeEnabled();
});

for (const width of [320, 375, 390, 430, 768, 1440]) {
  test(`responsive ${width}px: complete board, readable images, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 500 ? 780 : 1100 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('gridcell')).toHaveCount(36);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const board = await page.getByRole('grid').boundingBox();
    expect(board!.x).toBeGreaterThanOrEqual(0);
    expect(board!.x + board!.width).toBeLessThanOrEqual(width);
    expect(board!.width / 6).toBeGreaterThan(40);
    expect(
      await page
        .locator('.jellies img')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
    if (width < 500) {
      const start = await page.getByRole('button', { name: /START EXPERIMENT/ }).boundingBox();
      expect(start!.y + start!.height).toBeLessThan(780);
    }
    await page.screenshot({ path: `test-results/viewport-${width}.png`, fullPage: true });
  });
}

test('reduced motion, keyboard play and accessibility audit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?debug=1');
  const mainAudit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(mainAudit.violations).toEqual([]);
  await page.getByRole('button', { name: 'FORCE NO MATCH', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  const resultAudit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(resultAudit.violations).toEqual([]);
});

test('mobile shop, guide and bonus dialogs are accessible and stay within viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  for (const button of ['REWARD SHOP', 'HOW TO PLAY · 遊戲玩法', /A SECRET REACTION/]) {
    await page.getByRole('button', { name: button, exact: typeof button === 'string' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').evaluate(async (dialog) => {
      await Promise.all(dialog.getAnimations().map((animation) => animation.finished));
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
