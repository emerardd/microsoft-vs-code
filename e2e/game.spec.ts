import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => { page.on('pageerror', error => { throw error; }); });

async function instrument(page: Page) {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fillRect;
    let draws = 0;
    CanvasRenderingContext2D.prototype.fillRect = function (...args) { draws++; return original.apply(this, args); };
    Object.defineProperty(window, 'testDrawCount', { get: () => draws });
  });
}
const drawCount = (page: Page) => page.evaluate(() => (window as unknown as { testDrawCount: number }).testDrawCount);

test('pause and hidden document do not keep drawing or accept a resume shortcut', async ({ page }) => {
  await instrument(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'F5 Start Debugging' }).click();
  await page.getByTestId('upgrade-choice').first().click();
  await page.locator('canvas').click();
  await page.keyboard.press('p');
  await page.waitForTimeout(200);
  const paused = await drawCount(page);
  await page.waitForTimeout(300);
  expect(await drawCount(page)).toBe(paused);
  await page.getByRole('tab', { name: /enemies.json/ }).click();
  await page.locator('h2').click();
  await page.keyboard.press('p');
  const hidden = await drawCount(page);
  await page.waitForTimeout(300);
  expect(await drawCount(page)).toBe(hidden);
  await page.getByRole('tab', { name: /game_loop.ts/ }).click();
  await page.keyboard.press('p');
  await expect.poll(() => drawCount(page)).toBeGreaterThan(hidden);
});

test('keyup releases movement even when focus has moved to a button', async ({ page }) => {
  await page.goto('/e2e/harness.html?input');
  await page.keyboard.down('a');
  await page.getByRole('button', { name: 'Inspect keys' }).focus();
  await page.keyboard.up('a');
  await page.getByRole('button', { name: 'Inspect keys' }).click();
  await expect(page.getByTestId('keys')).toHaveText('');
  await page.getByRole('button', { name: 'Hide game' }).click();
  await page.locator('body').click({ position: { x: 600, y: 300 } });
  await page.keyboard.press('p');
  await expect(page.getByTestId('phase')).toHaveText('PAUSED');
});

test('settings survive reload and remain keyboard accessible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const slider = page.getByRole('slider');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('1.05');
  await page.getByRole('button', { name: '🔊 ON', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('slider')).toHaveValue('1.05');
  await expect(page.getByRole('button', { name: '🔇 MUTED', exact: true })).toBeVisible();
});

test('extension checkpoint restores paused and saves the next upgraded wave', async ({ page }) => {
  await page.goto('/e2e/harness.html');
  await page.getByRole('button', { name: 'Continue run' }).click();
  await page.locator('canvas').click();
  await page.clock.install();
  await page.keyboard.down('Space');
  for (let i = 0; i < 90; i++) {
    await page.clock.runFor(1000);
    if (await page.getByText('CHOOSE AN UPGRADE', { exact: true }).isVisible()) break;
  }
  await page.keyboard.up('Space');
  await expect(page.getByText('CHOOSE AN UPGRADE', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/qa/desktop-upgrades.png' });
  await page.locator('button').filter({ hasText: /Compiler|Heap Expansion|Buffer Overflow|Fast GC|Overclock|Piercing types|Reflect API|Buffer pressure/ }).first().click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('test-webview-state') ?? '{}').checkpoint?.stats.wave)).toBe(3);
  await page.reload();
  await expect(page.getByText('Wave v3.0 checkpoint restored. Continue when ready.')).toBeVisible();
});

test('mobile controls and layout stay inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'F5 Start Debugging' }).click();
  await page.getByTestId('upgrade-choice').first().click();
  await expect(page.getByRole('button', { name: 'Pause game', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'artifacts/qa/mobile-game.png' });
});

test('run report shows real outcomes and fits mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/e2e/harness.html?report');
  await expect(page.getByText('3:12', { exact: true })).toBeVisible();
  await expect(page.getByText('Piercing types → Reflect API → Buffer pressure')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rebuild & Restart' })).toBeVisible();
  await page.screenshot({ path: 'artifacts/qa/mobile-report.png' });
});


test('opening choice freezes time and enters the first wave with one upgrade', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'F5 Start Debugging' }).click();
  await expect(page.getByText('Choose your starting upgrade', { exact: true })).toBeVisible();
  await page.clock.install();
  await page.clock.runFor(10000);
  await expect(page.getByTestId('upgrade-choice')).toHaveCount(3);
  await page.getByTestId('upgrade-choice').first().click();
  await expect(page.getByTestId('run-stage')).toHaveText('Wave 1/5');
});

test('full five-wave run wins once, persists unlocks, and starts with the chosen loadout', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/e2e/harness.html?campaign');
  await page.getByRole('button', { name: 'Continue run' }).click();
  await page.clock.install();
  let upgrades = 0;
  await page.keyboard.down('Space');
  for (let second = 0; second < 350; second++) {
    await page.clock.runFor(1000);
    if (await page.getByTestId('upgrade-choice').first().isVisible()) {
      upgrades++;
      await page.keyboard.up('Space');
      await page.getByTestId('upgrade-choice').first().click();
      await page.keyboard.down('a');
      await page.clock.runFor(67);
      await page.keyboard.up('a');
      await page.keyboard.down('Space');
    }
    if (await page.getByText('BUILD PASSED', { exact: true }).isVisible()) break;
  }
  await page.keyboard.up('Space');
  await expect(page.getByText('BUILD PASSED', { exact: true })).toBeVisible();
  expect(upgrades).toBe(4);
  await expect(page.getByText('5 waves cleared · 1 wins · Permanent HP +2/10')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('test-webview-state') ?? '{}').checkpoint)).toBeNull();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('test-profile') ?? '{}'));
  await page.screenshot({ path: 'artifacts/qa/campaign-victory.png' });
  await page.reload();
  // Simulate reopening the panel with no checkpoint while keeping host-level profile storage.
  await expect(page.getByRole('radio', { name: /Piercing/ })).toBeEnabled();
  await page.getByRole('radio', { name: /Piercing/ }).check();
  await page.getByRole('button', { name: 'F5 Start Debugging' }).click();
  await page.getByTestId('upgrade-choice').filter({ hasText: /Fast GC|Overclock|Buffer Overflow|Reflect API|Buffer pressure/ }).first().click();
  const player = await page.evaluate(() => JSON.parse(localStorage.getItem('test-webview-state') ?? '{}').checkpoint.player);
  expect(player.weaponLevel).toBe(1);
  expect(player.pierceLevel).toBe(1);
  expect(player.maxHp).toBe(102);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('test-profile') ?? '{}'))).toEqual(saved);
});
