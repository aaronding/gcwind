import { test, expect } from '@playwright/test';

// Layout regressions are invisible to the behavioural specs: every control can
// work perfectly while the page scrolls sideways on a phone. 320px is the
// narrowest screen worth supporting; 560px is where the club tabs stop
// wrapping; from 1024px, in a window shorter than 900px (a landscape tablet
// or a laptop), the rings move into a column on the right.
const WIDTHS = [320, 375, 414, 560, 768, 1024, 1180, 1440];

const horizontalScroll = (page) =>
  page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth
  }));

/** The text of every matching element that is not wholly inside the viewport. */
const offscreen = (page, selector) =>
  page.evaluate((selector) => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll(selector)]
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return b.left < -1 || b.right > w + 1;
      })
      .map((el) => el.getAttribute('aria-label') ?? el.textContent.trim());
  }, selector);

/** Starts the page with `count` bags, the last one in use, so the bag row is at its fullest. */
async function withBags(page, count) {
  await page.addInitScript((count) => {
    if (localStorage.getItem('gcwind:v2')) return;
    localStorage.setItem(
      'gcwind:v2',
      JSON.stringify({
        version: 2,
        accounts: [{ activeBag: count - 1, bags: Array.from({ length: count }, () => ({})) }]
      })
    );
  }, count);
}

for (const choice of ['bag', 'flex']) {
  for (const width of WIDTHS) {
    test(`fits the viewport at ${width}px, five bags, on ${choice === 'bag' ? 'a bag' : 'Flex'}`, async ({
      page
    }) => {
      await withBags(page, 5);
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.getByTestId(choice === 'bag' ? 'bag-5' : 'bag-flex').click();
      await expect(page.getByTestId('result-current')).not.toHaveText('-');

      const { scroll, client } = await horizontalScroll(page);
      expect(scroll, `page scrolls horizontally at ${width}px`).toBeLessThanOrEqual(client);
    });
  }
}

for (const count of [1, 4, 5]) {
  test(`shows Flex, ${count} bag${count > 1 ? 's' : ''} and all seven club cards without scrolling, at every width`, async ({
    page
  }) => {
    await withBags(page, count);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      await expect(page.getByTestId('bag-flex')).toBeVisible();
      await expect(page.getByTestId(/^bag-\d$/)).toHaveCount(count);
      await expect(page.getByTestId(/^bag-club-/)).toHaveCount(7);

      expect(await offscreen(page, '[data-testid^="bag"]'), `off-screen at ${width}px`).toEqual([]);
    }
  });
}

const bagButtons = (page) => page.getByTestId('bag-bar').getByRole('group').getByRole('button');

test('keeps the bag buttons easy to tap on a phone with few bags', async ({ page }) => {
  await withBags(page, 3);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  for (const id of ['bag-flex', 'bag-1', 'bag-2', 'bag-3']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box.width, `${id} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${id} height`).toBeGreaterThanOrEqual(44);
  }
});

test('keeps five bags easy to tap on a phone, and not too wide on a desktop', async ({ page }) => {
  await withBags(page, 5);
  await page.goto('/');

  // Five bags, even on the narrowest phone: still a full-height target, and
  // never narrower than 34px.
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 800 });
    for (const box of await Promise.all(
      (await bagButtons(page).all()).map((b) => b.boundingBox())
    )) {
      expect(box.width, `button width at ${width}px`).toBeGreaterThanOrEqual(34);
      expect(box.height, `button height at ${width}px`).toBeGreaterThanOrEqual(44);
    }
    const manage = await page.getByTestId('bags-manage').boundingBox();
    expect(manage.width, `manage button width at ${width}px`).toBeGreaterThanOrEqual(34);
    // The name may give way to its icon, but never leaves the button's name.
    await expect(page.getByTestId('bags-manage')).toHaveAccessibleName('Bag 5, manage bags');
  }

  await page.setViewportSize({ width: 1024, height: 800 });
  const group = await page.getByTestId('bag-bar').getByRole('group').boundingBox();
  expect(group.width, 'bag buttons stop at a comfortable width').toBeLessThanOrEqual(420);
});

test('keeps the bag short on a phone, so more of the page fits', async ({ page }) => {
  // Seven cards in one row, well under the 85px a row of cards took before.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const cards = await page.getByTestId('bag-clubs').boundingBox();
  expect(cards.height).toBeLessThanOrEqual(70);
});

test('fits the bag editor on the narrowest phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.getByTestId('bags-manage').click();
  await page.getByTestId('bag-edit-1').click();

  const editor = page.getByTestId('bag-editor');
  await expect(editor).toBeVisible();
  expect(await offscreen(page, '[data-testid="bag-editor"] [data-testid^="bag-club-"]')).toEqual(
    []
  );
  const { scroll, client } = await horizontalScroll(page);
  expect(scroll).toBeLessThanOrEqual(client);
});

test('shows all seven club tabs without scrolling, at every width', async ({ page }) => {
  // The tabs belong to Flex, which the app then remembers across loads.
  await page.goto('/');
  await page.getByTestId('bag-flex').click();

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const tabs = page.getByRole('tab');
    await expect(tabs, `tab count at ${width}px`).toHaveCount(7);

    // Every tab must be inside the viewport, not off the side of a scroller.
    expect(await offscreen(page, '[role="tab"]'), `tabs off-screen at ${width}px`).toEqual([]);
  }
});

test('puts Max, Mid and Min beside the dial, and the club below it on a phone or before it on a portrait tablet', async ({
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

  await page.setViewportSize({ width: 820, height: 1180 });
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

// The largest phones, less the browser's own bars: about 780px of a Galaxy
// S25 Ultra (412 x 891) and 820px of an iPhone Pro Max (440 x 956) show the
// page. The bag, the wind, the settings and the rings down to Min fit in
// that; the club under the dial, the resources and the footer may sit below.
for (const [width, height] of [
  [412, 780],
  [440, 820]
]) {
  test(`shows the bag, the wind, the settings and the rings without scrolling at ${width} x ${height}`, async ({
    page
  }) => {
    await withBags(page, 5);
    await page.setViewportSize({ width, height });
    await page.goto('/');

    for (const id of [
      'bag-bar',
      'bag-clubs',
      'wind-keypad',
      'elevation-control',
      'result-current',
      'result-min'
    ]) {
      await expect(page.getByTestId(id), `${id} on screen`).toBeInViewport({ ratio: 1 });
    }
    // The club cards in one row.
    const tops = await page
      .getByTestId(/^bag-club-/)
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(tops).size, 'club cards in one row').toBe(1);
  });
}

// A wide, short window, a landscape tablet or a laptop: the rings in a column
// on the right, level with the bag and ending with the controls, the useful
// links under both, and everything down to Min on screen.
for (const [width, height] of [
  [1024, 768],
  [1180, 820],
  [1440, 800]
]) {
  test(`puts the rings beside the controls at ${width} x ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');

    const dial = await page.getByTestId('result-dial').boundingBox();
    const keypad = await page.getByTestId('wind-keypad').boundingBox();
    const cards = await page.getByTestId('bag-clubs').boundingBox();
    expect(dial.x, 'rings right of the wind').toBeGreaterThan(keypad.x + keypad.width);
    expect(dial.x, 'rings right of the bag').toBeGreaterThan(cards.x + cards.width);
    expect(dial.y, 'rings level with the bag').toBeLessThan(keypad.y);

    // Max, Mid and Min stacked beside the dial, and the club under both.
    const stats = await Promise.all(
      ['result-max', 'result-mid', 'result-min'].map((id) => page.getByTestId(id).boundingBox())
    );
    for (const box of stats) {
      expect(box.x, 'stat right of the dial').toBeGreaterThanOrEqual(dial.x + dial.width);
      expect(box.y, 'stat within the dial height').toBeGreaterThanOrEqual(dial.y);
      expect(box.y + box.height, 'stat within the dial height').toBeLessThanOrEqual(
        dial.y + dial.height
      );
    }
    const club = await page.getByTestId('detail-club-image').boundingBox();
    expect(club.y).toBeGreaterThanOrEqual(dial.y + dial.height);

    // The two columns end on the same line, on a bag and in Flex, where the
    // club tabs and levels make the controls much the taller.
    const bottoms = async () => {
      const rings = await page
        .locator('section', { has: page.getByTestId('result-dial') })
        .boundingBox();
      const controls = await page
        .locator('section', { has: page.getByTestId('wind-keypad') })
        .boundingBox();
      return [rings.y + rings.height, controls.y + controls.height];
    };
    let [rings, controls] = await bottoms();
    expect(Math.abs(rings - controls), 'rings and controls end together').toBeLessThan(2);
    await page.getByTestId('bag-flex').click();
    [rings, controls] = await bottoms();
    expect(Math.abs(rings - controls), 'still together in Flex').toBeLessThan(2);
    await page.getByTestId('bag-1').click();

    // The links run under both columns, from the left edge.
    const links = await page.getByRole('heading', { name: 'Useful Resources' }).boundingBox();
    expect(links.y, 'links under the rings').toBeGreaterThan(club.y + club.height);
    expect(links.x, 'links start at the left edge').toBeLessThan(cards.x + 20);

    await expect(page.getByTestId('result-min')).toBeInViewport({ ratio: 1 });
  });
}

test('keeps a wide, short window at a tablet width, centred, rather than stretching', async ({
  page
}) => {
  for (const width of [1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const bag = await page.getByTestId('bag-bar').boundingBox();
    const rings = await page
      .locator('section', { has: page.getByTestId('result-dial') })
      .boundingBox();
    const left = bag.x;
    const right = width - (rings.x + rings.width);
    expect(rings.x + rings.width - bag.x, `width at ${width}px`).toBeLessThanOrEqual(1240);
    expect(Math.abs(left - right), `centred at ${width}px`).toBeLessThan(2);

    // The header lines up with the page under it.
    const wordmark = await page.getByTestId('wordmark').boundingBox();
    expect(Math.abs(wordmark.x - bag.x), `header aligned at ${width}px`).toBeLessThan(2);
  }
});

// A window 900px tall or more shows the whole portrait layout, so a wide one
// keeps it: the rings under the controls, on a centred column, Min on screen
// on a bag and in Flex.
for (const [width, height] of [
  [1440, 900],
  [1920, 1080]
]) {
  test(`keeps the portrait layout in a tall window, ${width} x ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');

    const dial = await page.getByTestId('result-dial').boundingBox();
    const keypad = await page.getByTestId('wind-keypad').boundingBox();
    expect(dial.y, 'rings under the wind').toBeGreaterThan(keypad.y + keypad.height);

    const bag = await page.getByTestId('bag-bar').boundingBox();
    expect(bag.width, 'a portrait column').toBeLessThanOrEqual(820);
    expect(Math.abs(bag.x - (width - bag.x - bag.width)), 'centred').toBeLessThan(2);

    await expect(page.getByTestId('result-min')).toBeInViewport({ ratio: 1 });
    await page.getByTestId('bag-flex').click();
    await expect(page.getByTestId('result-min')).toBeInViewport({ ratio: 1 });
  });
}

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

  // The steppers and the keypad must be comfortably tappable.
  const keys = Array.from({ length: 10 }, (_, d) => `wind-key-${d}`);
  for (const id of ['wind-decrease', 'wind-increase', 'wind-clear', ...keys]) {
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

  // The logo is decoration and the gradient half is a span inside the
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
