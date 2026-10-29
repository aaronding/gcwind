import { test, expect } from '@playwright/test';

// Offline use, from the service worker in src/sw.js. The browser's offline mode
// covers the worker's own downloads too, so a page that loads here came from
// the worker's caches. Addressed through data-testid, like the other specs.

const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
});

test.afterEach(() => {
  expect(errors, 'console errors').toEqual([]);
});

/** Opens gcwind and waits for its service worker to install and take the page. */
async function install(page) {
  await page.goto('/');
  await expect(page.getByTestId('result-current')).not.toHaveText('-');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise((resolve) =>
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })
    );
  });
}

test('opens and calculates with no network after one visit', async ({ page, context }) => {
  await install(page);
  await page.getByTestId('bag-flex').click();
  const online = await page.getByTestId('result-current').textContent();

  await context.setOffline(true);
  await page.reload();

  // The saved picks are back, with the same answer, and it still calculates.
  await expect(page.getByTestId('result-current')).toHaveText(online);
  await page.getByTestId('wind-increase').click();
  await expect(page.getByTestId('result-current')).not.toHaveText(online);
});

test('shows the art of clubs not seen before going offline', async ({ page, context }) => {
  await install(page);
  await page.getByTestId('bag-flex').click();

  await context.setOffline(true);
  await page.getByRole('tab', { name: 'Sand' }).click();

  const first = page.getByTestId('club-list-sandwedges').locator('img').first();
  await expect(first).toBeVisible();
  await expect.poll(() => first.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);

  // Every sand wedge's, the ones scrolled out of sight included.
  const unanswered = await page.evaluate(async () => {
    const unanswered = [];
    for (const img of document.querySelectorAll('[data-testid^="club-list-"] img')) {
      const response = await fetch(img.src).catch(() => null);
      if (!response?.ok) unanswered.push(img.src);
    }
    return unanswered;
  });
  expect(unanswered).toEqual([]);
});
