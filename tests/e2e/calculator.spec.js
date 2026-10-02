import { test, expect } from '@playwright/test';

// Addressed through data-testid and visible text only, so this file is expected
// to survive the Svelte port untouched. If a change here becomes necessary
// during the port, that is a signal the port changed behaviour.

const rings = (page) => ({
  current: page.getByTestId('result-current'),
  max: page.getByTestId('result-max'),
  mid: page.getByTestId('result-mid'),
  min: page.getByTestId('result-min')
});

const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await expect(page.getByTestId('result-current')).not.toHaveText('-');
});

test.afterEach(() => {
  expect(errors, 'console errors').toEqual([]);
});

test('opens on the driver tab with the first club at max level', async ({ page }) => {
  const r = rings(page);
  await expect(r.current).toHaveText('8.3');
  await expect(r.max).toHaveText('8.3');
  await expect(r.mid).toHaveText('7.7');
  await expect(r.min).toHaveText('7.1');

  await expect(page.getByTestId('wind-input')).toHaveValue('10.0');
  await expect(page.getByTestId('detail-level')).toHaveText('Lv. 10');
  await expect(page.getByTestId('detail-powerball')).toHaveText('2');
  await expect(page.getByTestId('detail-elevation')).toHaveText('10%');
  await expect(page.getByTestId('detail-distance')).toHaveText('Max');
});

test('selecting a different club changes the result', async ({ page }) => {
  const before = await rings(page).current.textContent();
  await page.getByTestId('club-list-drivers').getByTestId('club-The Apocalypse').click();
  await expect(rings(page).current).not.toHaveText(before);
});

test('level count follows club rarity', async ({ page }) => {
  // Common 10, Rare 9, Epic 8.
  const levels = () => page.getByTestId('level-list-drivers').locator('[data-testid^="level-"]');

  await page.getByTestId('club-list-drivers').getByTestId('club-The Rocket').click();
  await expect(levels()).toHaveCount(10);

  await page.getByTestId('club-list-drivers').getByTestId('club-The Apocalypse').click();
  await expect(levels()).toHaveCount(8);
});

test('each tab remembers its own club and level', async ({ page }) => {
  await page.getByTestId('club-list-drivers').getByTestId('club-The Apocalypse').click();
  await page.getByTestId('level-list-drivers').getByTestId('level-3').click();
  await expect(page.getByTestId('detail-level')).toHaveText('Lv. 3');

  await page.getByRole('tab', { name: 'Wedge' }).click();
  await expect(page.getByTestId('detail-level')).not.toHaveText('Lv. 3');

  await page.getByRole('tab', { name: 'Driver' }).click();
  await expect(page.getByTestId('detail-level')).toHaveText('Lv. 3');
});

test('a remembered level is clamped when the new club has fewer', async ({ page }) => {
  await page.getByTestId('club-list-drivers').getByTestId('club-The Rocket').click();
  await page.getByTestId('level-list-drivers').getByTestId('level-10').click();
  await expect(page.getByTestId('detail-level')).toHaveText('Lv. 10');

  // Epic tops out at 8.
  await page.getByTestId('club-list-drivers').getByTestId('club-The Apocalypse').click();
  await expect(page.getByTestId('detail-level')).toHaveText('Lv. 8');
});

test('elevation and power ball shortcuts recalculate', async ({ page }) => {
  const before = await rings(page).current.textContent();

  await page.getByTestId('elevation-control').getByTestId('preset-30').click();
  await expect(page.getByTestId('detail-elevation')).toHaveText('30%');
  await expect(rings(page).current).not.toHaveText(before);

  await page.getByTestId('powerball-control').getByTestId('preset-10').click();
  await expect(page.getByTestId('detail-powerball')).toHaveText('10');
});

test('a dropdown value relabels the menu button and clears the shortcut', async ({ page }) => {
  // This is the path that broke under strict mode when updateStates() was
  // scoped inside a block, so it is worth asserting precisely.
  const control = page.getByTestId('elevation-control');
  await control.getByTestId('preset-30').click();
  await expect(control.getByTestId('preset-menu')).toHaveText('-');

  // Hover rather than click: on a hover-capable device mouseenter already
  // opens the dropdown, so a click on the trigger would toggle it shut again.
  await control.getByTestId('preset-menu').hover();
  await control.getByTestId('preset-option-45').click();
  await expect(page.getByTestId('detail-elevation')).toHaveText('45%');
  await expect(control.getByTestId('preset-menu')).toHaveText('45%');
});

test('wind speed accepts typing, stepping and clearing', async ({ page }) => {
  const wind = page.getByTestId('wind-input');

  await wind.fill('12.5');
  await expect(page.getByTestId('result-current')).not.toHaveText('-');

  await page.getByTestId('wind-increase').click();
  await expect(wind).toHaveValue('12.6');

  await page.getByTestId('wind-decrease').click();
  await page.getByTestId('wind-decrease').click();
  await expect(wind).toHaveValue('12.4');

  await page.getByTestId('wind-clear').click();
  await expect(wind).toHaveValue('');
  await expect(page.getByTestId('result-current')).toHaveText('-');
});

test('a wind speed above 25 is divided by ten', async ({ page }) => {
  const wind = page.getByTestId('wind-input');
  await wind.fill('137');
  await wind.dispatchEvent('input');
  await expect(wind).toHaveValue('13.7');
});

test('wind speed is clamped to the minimum', async ({ page }) => {
  const wind = page.getByTestId('wind-input');
  await wind.fill('0.05');
  await wind.dispatchEvent('input');
  await expect(wind).toHaveValue('0.1');
});

test('distance labels read Max, Mid and Min at the ends and middle', async ({ page }) => {
  const slider = page.getByTestId('distance-slider');
  const label = page.getByTestId('detail-distance');

  await expect(label).toHaveText('Max');

  await slider.evaluate((el) => {
    el.value = 50;
    el.dispatchEvent(new CustomEvent('sl-input', { bubbles: true }));
  });
  await expect(label).toHaveText('Mid');

  await slider.evaluate((el) => {
    el.value = 0;
    el.dispatchEvent(new CustomEvent('sl-input', { bubbles: true }));
  });
  await expect(label).toHaveText('Min');

  await slider.evaluate((el) => {
    el.value = 37;
    el.dispatchEvent(new CustomEvent('sl-input', { bubbles: true }));
  });
  await expect(label).toHaveText('37%');
});

test('the three feathering club types read zero at minimum distance', async ({ page }) => {
  // Deliberate: those clubs can be feathered to nothing, so Min is zero and Mid
  // sits at half of Max. Pinned as intended behaviour, not grandfathered.
  for (const tab of ['Wedge', 'Rough', 'Sand']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(rings(page).min, tab).toHaveText('0');
  }
});

test('the four club types with a floor keep a non-zero minimum', async ({ page }) => {
  for (const tab of ['Driver', 'Wood', 'Long', 'Short']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(rings(page).min, tab).not.toHaveText('0');
  }
});

test('the club image and disclaimer are present', async ({ page }) => {
  await expect(page.getByTestId('detail-club-image')).toBeVisible();
  await expect(page.getByText(/Not affiliated with, endorsed by/)).toBeVisible();
});

test('the feedback dialog opens and closes', async ({ page }) => {
  await page.getByTestId('feedback-open').click();
  await expect(page.getByTestId('feedback-dialog')).toHaveAttribute('open', '');
  await page.getByTestId('feedback-close').click();
  await expect(page.getByTestId('feedback-dialog')).not.toHaveAttribute('open', '');
});
