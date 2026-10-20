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

  // Changed deliberately: the app now opens on a bag, which plays from the
  // bag's clubs. Picking any club and level, which is what these tests
  // exercise, is Flex, beside the bags. See docs/modes-and-bags.md and
  // bags.spec.js.
  await page.getByTestId('bag-flex').click();
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
  // Changed deliberately: the level is a badge on the club picture now, which
  // shows just the number, as on the bag's club cards, rather than "Lv. 10".
  await expect(page.getByTestId('detail-level')).toHaveText('10');
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
  await expect(page.getByTestId('detail-level')).toHaveText('3');

  await page.getByRole('tab', { name: 'Wedge' }).click();
  await expect(page.getByTestId('detail-level')).not.toHaveText('3');

  await page.getByRole('tab', { name: 'Driver' }).click();
  await expect(page.getByTestId('detail-level')).toHaveText('3');
});

test('a remembered level is clamped when the new club has fewer', async ({ page }) => {
  await page.getByTestId('club-list-drivers').getByTestId('club-The Rocket').click();
  await page.getByTestId('level-list-drivers').getByTestId('level-10').click();
  await expect(page.getByTestId('detail-level')).toHaveText('10');

  // Epic tops out at 8.
  await page.getByTestId('club-list-drivers').getByTestId('club-The Apocalypse').click();
  await expect(page.getByTestId('detail-level')).toHaveText('8');
});

test('elevation and power ball shortcuts recalculate', async ({ page }) => {
  const before = await rings(page).current.textContent();

  await page.getByTestId('elevation-control').getByTestId('preset-30').click();
  await expect(page.getByTestId('detail-elevation')).toHaveText('30%');
  await expect(rings(page).current).not.toHaveText(before);

  await page.getByTestId('ballpower-control').getByTestId('preset-10').click();
  await expect(page.getByTestId('detail-powerball')).toHaveText('10');

  // 8 is a shortcut too, not only in the menu.
  await page.getByTestId('ballpower-control').getByTestId('preset-8').click();
  await expect(page.getByTestId('detail-powerball')).toHaveText('8');
  await expect(page.getByTestId('ballpower-control').getByTestId('preset-menu')).toHaveText('-');
});

test('a dropdown value relabels the menu button and clears the shortcut', async ({ page }) => {
  // This is the path that broke under strict mode when updateStates() was
  // scoped inside a block, so it is worth asserting precisely.
  const control = page.getByTestId('elevation-control');
  await control.getByTestId('preset-30').click();
  await expect(control.getByTestId('preset-menu')).toHaveText('-');

  // Changed with the Svelte rebuild: the dropdown opens on click now. The old
  // version opened on hover, which did nothing on touch and fought its own
  // click handler. Clicking works on both pointer types.
  await control.getByTestId('preset-menu').click();
  await control.getByTestId('preset-option-45').click();
  await expect(page.getByTestId('detail-elevation')).toHaveText('45%');
  await expect(control.getByTestId('preset-menu')).toHaveText('45%');
});

test('elevation reaches -30% and survives a reload', async ({ page }) => {
  const control = page.getByTestId('elevation-control');
  await control.getByTestId('preset-menu').click();
  await control.getByTestId('preset-option--30').click();
  await expect(page.getByTestId('detail-elevation')).toHaveText('-30%');

  await page.reload();
  await expect(page.getByTestId('detail-elevation')).toHaveText('-30%');
});

test('rough irons and sand wedges show no adjustment note', async ({ page }) => {
  // The calculator still applies their adjustment; the note explaining it
  // was removed on request.
  for (const tab of ['Rough', 'Sand']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByTestId('result-current')).not.toHaveText('-');
    await expect(page.getByTestId('category-note')).toHaveCount(0);
    await expect(page.getByText('adjustment already applied')).toHaveCount(0);
  }
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
  await wind.blur();
  await expect(wind).toHaveValue('0.1');
});

test('clicking the wind speed selects it, so typing replaces it', async ({ page }) => {
  const wind = page.getByTestId('wind-input');
  await wind.click();
  await wind.pressSequentially('12.5');
  await expect(wind).toHaveValue('12.5');
  await wind.press('Enter');

  // Formatted once you leave the field.
  await wind.click();
  await wind.pressSequentially('8');
  await wind.press('Enter');
  await expect(wind).toHaveValue('8.0');
});

test('the wind keypad fills in from the right', async ({ page }) => {
  const wind = page.getByTestId('wind-input');
  const press = async (digits) => {
    for (const d of digits) await page.getByTestId(`wind-key-${d}`).click();
  };

  await press('125');
  await expect(wind).toHaveValue('12.5');

  // A fourth digit starts a new number.
  await press('8');
  await expect(wind).toHaveValue('0.8');
  await press('0');
  await expect(wind).toHaveValue('8.0');

  await page.getByTestId('wind-clear').click();
  await expect(wind).toHaveValue('');
  await expect(rings(page).current).toHaveText('-');

  await press('95');
  await expect(wind).toHaveValue('9.5');

  // A stepper ends the entry, so the next digit starts afresh.
  await page.getByTestId('wind-increase').click();
  await expect(wind).toHaveValue('9.6');
  await press('3');
  await expect(wind).toHaveValue('0.3');
});

test('after clearing the wind, typing goes into the field', async ({ page }) => {
  const wind = page.getByTestId('wind-input');

  await page.getByTestId('wind-clear').click();
  await expect(wind).toHaveValue('');
  await expect(wind).toBeFocused();

  await page.keyboard.type('12.5');
  await expect(wind).toHaveValue('12.5');
  await expect(rings(page).current).not.toHaveText('-');
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true });

  // Focusing the field would raise the on-screen keyboard over the keypad.
  test('clearing the wind leaves the field unfocused', async ({ page }) => {
    await page.getByTestId('wind-clear').tap();
    await expect(page.getByTestId('wind-input')).toHaveValue('');
    await expect(page.getByTestId('wind-input')).not.toBeFocused();
  });
});

test('the wind keypad starts a new number after a pause', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const wind = page.getByTestId('wind-input');

  await page.getByTestId('wind-key-1').click();
  await page.getByTestId('wind-key-2').click();
  await expect(wind).toHaveValue('1.2');

  await page.clock.runFor(3000);
  await page.getByTestId('wind-key-7').click();
  await expect(wind).toHaveValue('0.7');
});

test('the wind has no slider; the keypad and the steppers set it', async ({ page }) => {
  // Removed deliberately: typing or stepping to the wind is quicker and surer
  // than dragging to it, and the card is shorter without it.
  await expect(page.getByTestId('wind-slider')).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Wind speed' })).toHaveCount(0);
});

// The slider is a native <input type="range"> since Shoelace was removed, so
// it emits `input` rather than `sl-input`. Same user-visible behaviour.
test('distance labels read Max, Mid and Min at the ends and middle', async ({ page }) => {
  const slider = page.getByTestId('distance-slider');
  const label = page.getByTestId('detail-distance');

  await expect(label).toHaveText('Max');

  await slider.evaluate((el) => {
    el.value = 50;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(label).toHaveText('Mid');

  await slider.evaluate((el) => {
    el.value = 0;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(label).toHaveText('Min');

  await slider.evaluate((el) => {
    el.value = 37;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(label).toHaveText('37%');
});

test('a distance other than Max is highlighted on the card and the slider', async ({ page }) => {
  const slider = page.getByTestId('distance-slider');
  const label = page.getByTestId('detail-distance');
  const set = (value) =>
    slider.evaluate((el, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  const fill = () => label.evaluate((el) => getComputedStyle(el).backgroundColor);

  // The handle's own colour is not readable from script, so the slider says
  // whether it is flagged and the stylesheet does the rest.
  await expect(label).toHaveAttribute('data-adjusted', 'false');
  await expect(slider).toHaveAttribute('data-adjusted', 'false');
  const plain = await fill();

  for (const value of [50, 0, 37]) {
    await set(value);
    await expect(label).toHaveAttribute('data-adjusted', 'true');
    await expect(slider).toHaveAttribute('data-adjusted', 'true');
    expect(await fill(), `at ${value}`).not.toBe(plain);
  }

  await set(100);
  await expect(label).toHaveAttribute('data-adjusted', 'false');
  await expect(slider).toHaveAttribute('data-adjusted', 'false');
  expect(await fill()).toBe(plain);
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

test('the selected club image is shown', async ({ page }) => {
  await expect(page.getByTestId('detail-club-image')).toBeVisible();
});

// Changed deliberately: the disclaimer used to sit at the foot of every visit
// and now lives behind the About link, so it is no longer visible on load.
test('the about dialog carries the disclaimer', async ({ page }) => {
  const disclaimer = page.getByText(/not affiliated with, endorsed by/i);
  await expect(disclaimer).toBeHidden();

  await page.getByTestId('about-open').click();
  await expect(page.getByTestId('about-dialog')).toHaveAttribute('open', '');
  await expect(disclaimer).toBeVisible();

  await expect(page.getByTestId('app-version')).toHaveText(/^Version \d+\.\d+\.\d+$/);
  await page.getByTestId('about-dialog-close').click();
  await expect(page.getByTestId('about-dialog')).not.toHaveAttribute('open', '');
});

test('the resource links point where they should', async ({ page }) => {
  const links = page.locator('.link-row a');
  await expect(links).toHaveCount(2);
  await expect(page.getByRole('link', { name: /Golf Clash Tommy/ })).toHaveAttribute(
    'href',
    'https://golfclashtommy.com'
  );
  await expect(page.getByRole('link', { name: /r\/GolfClash/ })).toHaveAttribute(
    'href',
    'https://www.reddit.com/r/GolfClash/'
  );
  // Removed on request; make sure they do not creep back.
  await expect(page.getByRole('link', { name: /Notebook/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /YouTube/ })).toHaveCount(0);
});

test('links back to webthinking.io without posing as a game resource', async ({ page }) => {
  const link = page.getByTestId('webthinking-link');
  await expect(link).toHaveAttribute('href', 'https://webthinking.io');
  await expect(link).toHaveAttribute('rel', /noopener/);

  // It belongs in the footer, not among the Golf Clash resources, where a
  // player looking for game help would be misled by it.
  await expect(page.locator('.link-row [data-testid="webthinking-link"]')).toHaveCount(0);
  await expect(page.locator('.link-row a')).toHaveCount(2);
});

test('the feedback dialog opens and closes', async ({ page }) => {
  await page.getByTestId('feedback-open').click();
  await expect(page.getByTestId('feedback-dialog')).toHaveAttribute('open', '');
  await page.getByTestId('feedback-dialog-close').click();
  await expect(page.getByTestId('feedback-dialog')).not.toHaveAttribute('open', '');
});
