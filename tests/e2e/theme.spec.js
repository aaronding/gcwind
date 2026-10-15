import { test, expect } from '@playwright/test';

const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const attr = (page) => page.evaluate(() => document.documentElement.dataset.theme);

test('follows the system when set to auto', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.getByTestId('theme-auto')).toHaveAttribute('aria-pressed', 'true');
  const dark = await bg(page);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await bg(page);

  expect(dark, 'auto did not follow the system').not.toBe(light);
});

test('light and dark override the system', async ({ page }) => {
  // The system says dark; choosing light must win.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const systemDark = await bg(page);

  await page.getByTestId('theme-light').click();
  expect(await attr(page)).toBe('light');
  const forcedLight = await bg(page);
  expect(forcedLight).not.toBe(systemDark);

  await page.getByTestId('theme-dark').click();
  expect(await attr(page)).toBe('dark');
  expect(await bg(page)).toBe(systemDark);
});

test('returns to following the system when auto is chosen again', async ({ page }) => {
  // The gap that let a broken toggle through: every earlier test moved between
  // light and dark and never back, so "auto" was only ever the untouched
  // starting state.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const systemDark = await bg(page);

  await page.getByTestId('theme-light').click();
  expect(await attr(page)).toBe('light');
  expect(await bg(page)).not.toBe(systemDark);

  await page.getByTestId('theme-auto').click();
  expect(await attr(page)).toBe('auto');
  await expect(page.getByTestId('theme-auto')).toHaveAttribute('aria-pressed', 'true');
  expect(await bg(page), 'auto did not go back to the system colour').toBe(systemDark);

  // And it keeps following the system afterwards.
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await bg(page)).not.toBe(systemDark);
});

test('every move between the three choices takes effect', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');

  const order = ['dark', 'light', 'auto', 'dark', 'auto', 'light'];
  for (const choice of order) {
    await page.getByTestId(`theme-${choice}`).click();
    expect(await attr(page), `after choosing ${choice}`).toBe(choice);
    const expected = choice === 'dark' ? 'dark' : 'light';
    const scheme = await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme
    );
    expect(scheme, `color-scheme after ${choice}`).toContain(expected);
  }
});

test('remembers the choice across a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');

  await page.getByTestId('theme-dark').click();
  const chosen = await bg(page);

  await page.reload();
  expect(await attr(page)).toBe('dark');
  await expect(page.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true');
  expect(await bg(page), 'the saved theme was not restored').toBe(chosen);
});

test('applies the saved theme before the app renders, so it cannot flash', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByTestId('theme-dark').click();

  // Catch the attribute at the earliest possible moment on the next load: if it
  // were only set once Svelte mounted, a light frame would be painted first.
  await page.addInitScript(() => {
    window.__themeAtStart = null;
    document.addEventListener('readystatechange', () => {
      if (window.__themeAtStart === null) {
        window.__themeAtStart = document.documentElement.dataset.theme ?? 'unset';
      }
    });
  });

  await page.reload();
  expect(await page.evaluate(() => window.__themeAtStart)).toBe('dark');
});

test('exposes all three choices to assistive technology', async ({ page }) => {
  await page.goto('/');
  const group = page.getByTestId('theme-toggle');
  await expect(group).toHaveAttribute('aria-label', 'Theme');

  for (const [id, label] of [
    ['theme-auto', 'System theme'],
    ['theme-light', 'Light theme'],
    ['theme-dark', 'Dark theme']
  ]) {
    await expect(page.getByTestId(id)).toHaveAccessibleName(label);
  }

  // Exactly one is pressed at a time.
  await page.getByTestId('theme-light').click();
  await expect(page.locator('[data-testid^="theme-"][aria-pressed="true"]')).toHaveCount(1);
});
