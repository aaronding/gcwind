import { test, expect } from '@playwright/test';

// The endpoint lives on the Worker, which `vite preview` does not run, so these
// intercept /api/feedback. That is the right boundary anyway: the Worker's own
// behaviour is covered by tests/feedback.test.js, and what matters here is that
// the page sends exactly what the dialog shows, and only when Send is pressed.

/** Records every POST the page makes to the endpoint. */
async function intercept(page, { status = 204 } = {}) {
  const posts = [];
  await page.route('**/api/feedback', async (route) => {
    const request = route.request();
    posts.push({ method: request.method(), body: request.postDataJSON() });
    await route.fulfill({ status });
  });
  return posts;
}

test('sends nothing until Send is pressed', async ({ page }) => {
  const posts = await intercept(page);
  await page.goto('/');

  await page.getByTestId('feedback-open').click();
  await page.getByTestId('feedback-message').fill('the wedge numbers look off');
  await page.waitForTimeout(300);

  expect(posts, 'a request went before Send').toEqual([]);
});

test('sends exactly what the dialog shows, and nothing else', async ({ page }) => {
  const posts = await intercept(page);
  await page.goto('/');

  await page.getByTestId('feedback-open').click();
  await page.getByTestId('feedback-message').fill('great tool, thanks');
  await page.getByTestId('feedback-send').click();

  await expect(page.getByTestId('feedback-status')).toHaveText(/sent/i);
  expect(posts).toHaveLength(1);
  expect(posts[0].method).toBe('POST');
  // No honeypot when it is empty, and nothing about the current club or wind.
  expect(posts[0].body).toEqual({ message: 'great tool, thanks' });
});

test('will not send an empty or whitespace-only message', async ({ page }) => {
  const posts = await intercept(page);
  await page.goto('/');

  await page.getByTestId('feedback-open').click();
  await expect(page.getByTestId('feedback-send')).toBeDisabled();

  await page.getByTestId('feedback-message').fill('   \n  ');
  await expect(page.getByTestId('feedback-send')).toBeDisabled();

  await page.getByTestId('feedback-send').click({ force: true });
  expect(posts).toEqual([]);
});

test('clears the box once sent', async ({ page }) => {
  await intercept(page);
  await page.goto('/');

  await page.getByTestId('feedback-open').click();
  await page.getByTestId('feedback-message').fill('first message');
  await page.getByTestId('feedback-send').click();

  await expect(page.getByTestId('feedback-status')).toHaveText(/sent/i);
  await expect(page.getByTestId('feedback-message')).toHaveValue('');
});

test('keeps what was written when sending fails', async ({ page }) => {
  await intercept(page, { status: 500 });
  await page.goto('/');

  const written = 'something worth not losing';
  await page.getByTestId('feedback-open').click();
  await page.getByTestId('feedback-message').fill(written);
  await page.getByTestId('feedback-send').click();

  await expect(page.getByTestId('feedback-status')).toHaveText(/could not send/i);
  await expect(page.getByTestId('feedback-message')).toHaveValue(written);
});

test('the honeypot is hidden from people and from screen readers', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('feedback-open').click();

  const honeypot = page.locator('input[name="website"]');
  await expect(honeypot).toHaveCount(1);
  await expect(honeypot).toBeHidden();
  await expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  await expect(honeypot).toHaveAttribute('tabindex', '-1');
});

test('no Google Form is loaded any more', async ({ page }) => {
  const external = [];
  page.on('request', (r) => {
    const url = r.url();
    if (!url.startsWith('http://localhost')) external.push(url);
  });

  await page.goto('/');
  await page.getByTestId('feedback-open').click();
  await page.waitForTimeout(500);

  expect(page.locator('iframe')).toHaveCount(0);
  expect(external, 'the page reached a third party').toEqual([]);
});
