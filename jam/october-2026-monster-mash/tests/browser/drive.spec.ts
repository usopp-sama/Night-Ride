import { test, expect } from '@playwright/test';
import { FixedStepper } from '../../web/stepper';

test('fixed ticks are frame-rate independent, catch-up is bounded, pause clears remainder', () => {
  for (const hz of [15, 30, 60, 144]) {
    const clock = new FixedStepper(); let ticks = 0;
    for (let i = 0; i < hz * 10; ++i) clock.advance(1 / hz, () => ++ticks);
    expect(ticks).toBe(600);
  }
  const clock = new FixedStepper(); let ticks = 0;
  clock.advance(10, () => ++ticks); expect(ticks).toBe(6); expect(clock.droppedSeconds).toBeCloseTo(9.9);
  clock.advance(0.01, () => ++ticks); clock.reset(); clock.advance(0.01, () => ++ticks); expect(ticks).toBe(6);
});

test('production driving: accelerate, brake, pause, recover and restart', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/drive.html');
  await expect(page.locator('html')).toHaveAttribute('data-drive-ready', 'true');
  await page.getByRole('button', { name: 'Start driving' }).click();
  const telemetry = page.locator('#telemetry-values');
  await page.keyboard.down('w');
  await expect.poll(async () => Number(await telemetry.getAttribute('data-speed')), { timeout: 10000 }).toBeGreaterThan(5);
  await page.keyboard.up('w'); await page.keyboard.down('s');
  await expect.poll(async () => Math.abs(Number(await telemetry.getAttribute('data-speed'))), { timeout: 10000 }).toBeLessThan(0.3);
  await page.keyboard.up('s');
  await page.screenshot({ path: testInfo.outputPath('first-drive.png') });
  await page.keyboard.press('p');
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'paused');
  await page.waitForTimeout(150); const tick = await telemetry.getAttribute('data-tick');
  await page.waitForTimeout(300); expect(await telemetry.getAttribute('data-tick')).toBe(tick);
  await page.getByRole('button', { name: 'Back to the road' }).click();
  await page.keyboard.press('r');
  await expect(telemetry).toHaveAttribute('data-recoveries', '1');
  await page.getByRole('button', { name: 'Telemetry' }).click();
  await page.getByRole('button', { name: 'Restart lap session' }).click();
  await expect(telemetry).toHaveAttribute('data-tick', '0');
  expect(errors).toEqual([]);
});

test('nested driving entry and narrow touch controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/night-ride/drive.html');
  await expect(page.locator('html')).toHaveAttribute('data-drive-ready', 'true');
  await page.getByRole('button', { name: 'Start driving' }).click();
  const go = page.getByRole('button', { name: 'Go', exact: true });
  const box = (await go.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await expect.poll(async () => Number(await page.locator('#telemetry-values').getAttribute('data-speed'))).toBeGreaterThan(2);
  await page.mouse.up();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('missing driving WASM leaves atlas exit and an actionable error', async ({ page }) => {
  await page.route('**/*.wasm', route => route.abort()); await page.goto('/drive.html');
  await expect(page.getByRole('status')).toContainText('rebuild and reload');
  await expect(page.getByRole('link', { name: 'Explore seed worlds' })).toBeVisible();
  await expect(page.locator('#start')).toBeDisabled();
});

test('focus loss pauses and clears held throttle before resume', async ({ page }) => {
  await page.goto('/drive.html'); await page.getByRole('button', { name: 'Start driving' }).click();
  await page.keyboard.down('w');
  await expect.poll(async () => Number(await page.locator('#telemetry-values').getAttribute('data-speed'))).toBeGreaterThan(2);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'paused');
  await page.keyboard.up('w');
  await page.getByRole('button', { name: 'Back to the road' }).click();
  // Engine response decays over several ticks, so coasting can briefly gain speed.
  // Check the actual throttle channel instead of assuming instantaneous torque cutoff.
  await expect.poll(async () => Number(await page.locator('#telemetry-values').getAttribute('data-throttle'))).toBeLessThan(0.01);
});

test('standard controller dead zone, trigger, pause and disconnect', async ({ page }) => {
  await page.addInitScript(() => {
    const pad = { mapping: 'standard', axes: [0.08, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), connected: true };
    Object.defineProperty(navigator, 'getGamepads', { value: () => pad.connected ? [pad] : [] });
    Object.assign(window, { testPad: pad });
  });
  await page.goto('/drive.html'); await page.getByRole('button', { name: 'Start driving' }).click();
  const telemetry = page.locator('#telemetry-values');
  await expect.poll(async () => Number(await telemetry.getAttribute('data-tick'))).toBeGreaterThan(20);
  expect(Math.abs(Number(await telemetry.getAttribute('data-speed')))).toBeLessThan(0.1);
  await page.evaluate(() => { const pad = (window as unknown as { testPad: { buttons: { value: number; pressed: boolean }[] } }).testPad; pad.buttons[7] = { value: 0.7, pressed: true }; });
  await expect.poll(async () => Number(await telemetry.getAttribute('data-speed'))).toBeGreaterThan(2);
  await page.evaluate(() => { const pad = (window as unknown as { testPad: { buttons: { value: number; pressed: boolean }[] } }).testPad; pad.buttons[9] = { value: 1, pressed: true }; });
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'paused');
  await page.evaluate(() => { const pad = (window as unknown as { testPad: { buttons: { value: number; pressed: boolean }[] } }).testPad; pad.buttons[9] = { value: 0, pressed: false }; pad.buttons[7] = { value: 0, pressed: false }; });
  await page.getByRole('button', { name: 'Back to the road' }).click();
  await page.evaluate(() => { (window as unknown as { testPad: { connected: boolean } }).testPad.connected = false; window.dispatchEvent(new Event('gamepaddisconnected')); });
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'paused');
});
