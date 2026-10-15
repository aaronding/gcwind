import { test, expect } from '@playwright/test';

// Layout regressions are invisible to the behavioural specs: every control can
// work perfectly while the page scrolls sideways on a phone. 320px is the
// narrowest screen worth supporting; 560px is where the club tabs stop
// wrapping.
const WIDTHS = [320, 375, 414, 560, 768, 1024];

for (const width of WIDTHS) {
  test(`fits the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByTestId('result-current')).not.toHaveText('-');

    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth
    }));

    expect(scroll, `page scrolls horizontally at ${width}px`).toBeLessThanOrEqual(client);
  });
}

test('shows all seven club tabs without scrolling, at every width', async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const tabs = page.getByRole('tab');
    await expect(tabs, `tab count at ${width}px`).toHaveCount(7);

    // Every tab must be inside the viewport, not off the side of a scroller.
    const offscreen = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      return [...document.querySelectorAll('[role="tab"]')]
        .filter((t) => {
          const b = t.getBoundingClientRect();
          return b.left < -1 || b.right > w + 1;
        })
        .map((t) => t.textContent.trim());
    });

    expect(offscreen, `tabs off-screen at ${width}px`).toEqual([]);
  }
});

test('keeps the wind stepper usable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');

  // Both steppers flank the value and must be comfortably tappable.
  for (const id of ['wind-decrease', 'wind-increase']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box.width, `${id} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${id} height`).toBeGreaterThanOrEqual(44);
  }
});

test('names one canonical address, so the two URLs do not compete', async ({ page }) => {
  // The app answers at both gcwind.webthinking.io and webthinking.io/gcwind.
  // Without a canonical they are duplicate content and search engines split
  // the ranking between them, which works against the windchum keywords the
  // meta deliberately targets.
  await page.goto('/');

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  await expect(canonical).toHaveAttribute('href', 'https://gcwind.webthinking.io/');

  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://gcwind.webthinking.io/'
  );
});
