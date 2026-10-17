import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// Export and Import (docs/backup.md). Addressed through data-testid and
// visible text, like the other specs.

const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
});

test.afterEach(() => {
  expect(errors, 'console errors').toEqual([]);
});

/** Three bags, the second in use, as another device might have them. */
const THREE_BAGS = {
  version: 2,
  mode: 'bag',
  clubType: 'drivers',
  windSpeed: 8.7,
  powerBall: 6,
  elevation: 20,
  distance: 100,
  flex: { selections: {} },
  activeAccount: 0,
  accounts: [
    {
      name: 'Account 1',
      activeBag: 1,
      bags: [
        { name: 'Tour 10', selections: { drivers: { club: 'The Apocalypse', level: 7 } } },
        { name: 'Approach', selections: { wedges: { club: 'The Endbringer', level: 6 } } },
        { name: 'Windy', selections: {} }
      ]
    }
  ]
};

const bagButtons = (page) => page.getByTestId(/^bag-\d$/);

async function open(page, store) {
  await page.goto('/');
  if (store) {
    await page.evaluate((s) => localStorage.setItem('gcwind:v2', JSON.stringify(s)), store);
    await page.reload();
  }
  await expect(page.getByTestId('result-current')).not.toHaveText('-');
}

async function openBackup(page) {
  await page.getByTestId('bags-manage').click();
  await expect(page.getByTestId('bags-dialog')).toBeVisible();
}

/** Exports from `page` and returns the downloaded file's path. */
async function exportFile(page) {
  await openBackup(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('backup-export').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/^gcwind-backup-\d{4}-\d{2}-\d{2}\.json$/);
  await expect(page.getByTestId('backup-status')).toContainText('Saved gcwind-backup-');
  return download.path();
}

test('exports a file that another browser imports, after a summary, and can undo', async ({
  page,
  browser
}) => {
  await open(page, THREE_BAGS);
  const file = await exportFile(page);
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(saved).toMatchObject({ app: 'gcwind', version: 2 });
  expect(saved.data.accounts[0].bags.map((b) => b.name)).toEqual(['Tour 10', 'Approach', 'Windy']);

  // A fresh browser, with one starter bag.
  const other = await browser.newContext();
  const fresh = await other.newPage();
  await open(fresh);
  await expect(bagButtons(fresh)).toHaveCount(1);

  await openBackup(fresh);
  await fresh.getByTestId('backup-file').setInputFiles(file);
  await expect(fresh.getByTestId('backup-confirm')).toContainText('Replace your saved data');
  // The summary is part of the bag manager, not a second dialog on top of it.
  await expect(fresh.locator('dialog[open]')).toHaveCount(1);
  await expect(fresh.getByTestId('backup-source')).toContainText('3 bags');
  await expect(fresh.getByTestId(/^backup-bag-\d$/)).toHaveCount(3);
  await expect(fresh.getByTestId('backup-replaces')).toContainText('“Bag 1”');

  await fresh.getByTestId('backup-replace').click();
  await expect(fresh.getByTestId('backup-status')).toContainText('Imported 3 bags');
  await fresh.getByTestId('bags-dialog-close').click();

  await expect(bagButtons(fresh)).toHaveCount(3);
  await expect(fresh.getByTestId('bag-2')).toHaveAttribute('aria-pressed', 'true');
  await expect(fresh.getByTestId('bag-name')).toHaveText('Approach');

  // It is saved, so a reload keeps it.
  await fresh.reload();
  await expect(bagButtons(fresh)).toHaveCount(3);

  // Undo, even after the reload.
  await openBackup(fresh);
  await fresh.getByTestId('backup-undo').click();
  await expect(fresh.getByTestId('backup-status')).toHaveText('Your previous data is back.');
  await expect(fresh.getByTestId('backup-undo')).toHaveCount(0);
  await fresh.getByTestId('bags-dialog-close').click();
  await expect(bagButtons(fresh)).toHaveCount(1);
  await expect(fresh.getByTestId('bag-name')).toHaveText('Bag 1');

  await other.close();
});

test('cancelling an import changes nothing', async ({ page }) => {
  await open(page);
  await openBackup(page);
  await page.getByTestId('backup-file').setInputFiles({
    name: 'gcwind-backup-2026-10-14.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ app: 'gcwind', version: 2, data: THREE_BAGS }))
  });
  await page.getByTestId('backup-cancel').click();
  await expect(page.getByTestId('backup-confirm')).toHaveCount(0);
  await expect(page.getByTestId('backup-undo')).toHaveCount(0);
  await page.getByTestId('bags-dialog-close').click();
  await expect(bagButtons(page)).toHaveCount(1);
});

for (const [what, text, message] of [
  ['another app’s file', '{"name": "notes"}', 'This file is not a gcwind backup.'],
  ['a damaged file', '{"app": "gcwind", "version": 2, "da', 'This file is damaged or incomplete.'],
  [
    'a newer backup',
    JSON.stringify({ app: 'gcwind', version: 99, data: THREE_BAGS }),
    'This backup comes from a newer gcwind.'
  ]
]) {
  test(`refuses ${what} and keeps the bags`, async ({ page }) => {
    await open(page, THREE_BAGS);
    await openBackup(page);
    await page.getByTestId('backup-file').setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(text)
    });
    await expect(page.getByTestId('backup-error')).toContainText(message);
    await page.getByTestId('bags-dialog-close').click();
    await expect(bagButtons(page)).toHaveCount(3);
  });
}

test('an import shows up in another open tab, which does not write its old bags back', async ({
  page,
  context
}) => {
  await open(page);
  const other = await context.newPage();
  await open(other);

  await openBackup(page);
  await page.getByTestId('backup-file').setInputFiles({
    name: 'gcwind-backup-2026-10-14.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ app: 'gcwind', version: 2, data: THREE_BAGS }))
  });
  await page.getByTestId('backup-replace').click();

  await expect(bagButtons(other)).toHaveCount(3);

  // A change in the other tab saves its bags, which are now the imported ones.
  await other.getByTestId('bag-3').click();
  await page.reload();
  await expect(bagButtons(page)).toHaveCount(3);
  await expect(page.getByTestId('bag-3')).toHaveAttribute('aria-pressed', 'true');
});

test('a press that starts on the top edge of Replace still replaces', async ({ page }) => {
  await open(page);
  await openBackup(page);
  await page.getByTestId('backup-file').setInputFiles({
    name: 'gcwind-backup-2026-10-14.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ app: 'gcwind', version: 2, data: THREE_BAGS }))
  });

  // The face drops by its bevel while pressed, so the release lands above
  // where it now is.
  const box = await page.getByTestId('backup-replace').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 1);
  await page.mouse.down();
  // Held as a finger holds it, past the 90ms the face takes to drop.
  await page.waitForTimeout(200);
  await page.mouse.up();

  await expect(page.getByTestId('backup-status')).toContainText('Imported 3 bags');
});
