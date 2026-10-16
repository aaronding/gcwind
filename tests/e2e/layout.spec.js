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

test('puts Max, Mid and Min beside the dial, and the club below it on a phone or before it on a desktop', async ({
  page
}) => {
  const boxes = async () => ({
    dial: await page.getByTestId('result-dial').boundingBox(),
    club: await page.getByTestId('detail-club-image').boundingBox(),
    stats: await Promise.all(
      ['result-max', 'result-mid', 'result-min'].map((id) => page.getByTestId(id).boundingBox())
    )
  });

  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');

  let { dial, club, stats } = await boxes();
  for (const [i, box] of stats.entries()) {
    expect(box.x, `stat ${i} sits right of the dial`).toBeGreaterThanOrEqual(dial.x + dial.width);
    expect(box.y, `stat ${i} starts within the dial's height`).toBeGreaterThanOrEqual(dial.y);
    expect(box.y + box.height, `stat ${i} ends within it`).toBeLessThanOrEqual(
      dial.y + dial.height
    );
  }
  expect(club.y, 'club details sit below the dial').toBeGreaterThanOrEqual(dial.y + dial.height);

  await page.setViewportSize({ width: 1024, height: 800 });
  ({ dial, club, stats } = await boxes());
  expect(club.x + club.width, 'club details sit left of the dial').toBeLessThanOrEqual(dial.x);
  for (const [i, box] of stats.entries()) {
    expect(box.x, `stat ${i} sits right of the dial`).toBeGreaterThanOrEqual(dial.x + dial.width);
  }
  // Stacked, as on a phone: one column, top to bottom.
  expect(stats[1].y).toBeGreaterThan(stats[0].y);
  expect(stats[2].y).toBeGreaterThan(stats[1].y);
  expect(Math.abs(stats[2].x - stats[0].x)).toBeLessThan(2);
});

test('makes the ring count the largest number on the page, at every width', async ({ page }) => {
  // The rings are what a player opens the app for; the wind speed is the
  // only other number of comparable size.
  const size = (id) =>
    page.getByTestId(id).evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    expect(await size('result-current'), `at ${width}px`).toBeGreaterThan(await size('wind-input'));
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

test('share metadata names people and things, not hostnames', async ({ page }) => {
  // These three all held a hostname where a name belongs, which left the tool
  // listed as its own author and a bare domain as the share-card label.
  await page.goto('/');

  const meta = async (selector) => page.locator(selector).first().getAttribute('content');

  expect(await meta('meta[name="author"]')).toBe('webthinking');
  expect(await meta('meta[property="og:site_name"]')).toBe('gcwind');

  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    const title = await meta(selector);
    expect(title).toBe('Golf Clash Wind Calculator');
    expect(title, 'a hostname crept back into the title').not.toContain('webthinking.io');
  }
});

test('names the app with the gcwind wordmark', async ({ page }) => {
  await page.goto('/');

  // The flag is decoration and the gradient half is a span inside the
  // heading; neither may change or split the name.
  await expect(page.getByRole('heading', { level: 1, name: 'gcwind', exact: true })).toBeVisible();
});

for (const width of [320, 375]) {
  test(`shows the feedback button in the header without scrolling at ${width}px`, async ({
    page
  }) => {
    // Most visitors arrive on a phone and never reach the footer, which is
    // where this used to be.
    await page.setViewportSize({ width, height: 640 });
    await page.goto('/');

    const button = page.locator('header').getByTestId('feedback-open');
    await expect(button).toBeInViewport({ ratio: 1 });
    await expect(button).toHaveAccessibleName('Feedback');

    const box = await button.boundingBox();
    expect(box.y, 'feedback button sits on the first row').toBeLessThan(60);
    expect(box.width, 'feedback button is icon-only on a phone').toBeLessThan(40);
  });
}

test('labels the feedback button on a wide screen', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/');

  const button = page.locator('header').getByTestId('feedback-open');
  const box = await button.boundingBox();
  expect(box.width, 'feedback button shows its label').toBeGreaterThan(60);
});
