import { test, expect } from '@playwright/test';

// Bags and Flex (docs/modes-and-bags.md, step 2). Addressed through
// data-testid, accessible names and visible text, like the other specs.

const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
});

test.afterEach(() => {
  expect(errors, 'console errors').toEqual([]);
});

async function open(page) {
  await page.goto('/');
  await expect(page.getByTestId('result-current')).not.toHaveText('-');
}

const card = (page, type) => page.getByTestId('bag-clubs').getByTestId(`bag-club-${type}`);
const bagButtons = (page) => page.getByTestId(/^bag-\d$/);

/** In the open bag editor, sets one type's club and level. */
async function pick(page, type, club, level) {
  const editor = page.getByTestId('bag-editor');
  await editor.getByTestId(`bag-club-${type}`).click();
  await editor.getByTestId(`club-list-${type}`).getByTestId(`club-${club}`).click();
  await editor.getByTestId(`level-list-${type}`).getByTestId(`level-${level}`).click();
}

test('opens on Bag 1 with the starter clubs, and Flex and + beside it', async ({ page }) => {
  await open(page);

  await expect(bagButtons(page)).toHaveCount(1);
  await expect(page.getByTestId('bag-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('bag-flex')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('bag-add')).toHaveAccessibleName('Add a bag');
  await expect(page.getByTestId('bag-name')).toHaveText('Bag 1');

  // The club in hand is the driver, so the rings match the old opening screen.
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Rocket, level 10');
  await expect(card(page, 'drivers')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('result-current')).toHaveText('8.3');

  // No club list or levels on a bag.
  await expect(page.getByTestId('club-list-drivers')).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
});

test('tapping a club card puts that club in hand', async ({ page }) => {
  await open(page);
  const before = await page.getByTestId('result-current').textContent();

  await card(page, 'woods').click();
  await expect(card(page, 'woods')).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page, 'drivers')).toHaveAttribute('aria-pressed', 'false');
  // The level is a number on the picture, in the club's rarity colour.
  await expect(card(page, 'woods')).toContainText('8');
  await expect(page.getByTestId('detail-level')).toHaveText('8');
  await expect(page.getByTestId('result-current')).not.toHaveText(before);
});

test('+ adds a bag that starts as a copy, and each bag keeps its own clubs across a reload', async ({
  page
}) => {
  await open(page);

  // Bag 1
  await page.getByTestId('bag-edit').click();
  await expect(page.getByTestId('bag-editor')).toBeVisible();
  await pick(page, 'drivers', 'The Apocalypse', 3);
  await pick(page, 'wedges', 'The Firefly', 6);
  await page.getByTestId('bag-editor-done').click();
  await expect(page.getByTestId('bag-editor')).toBeHidden();

  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Apocalypse, level 3');
  await expect(page.getByTestId('detail-level')).toHaveText('3');
  const bag1Rings = await page.getByTestId('result-current').textContent();

  // Bag 2 starts with Bag 1's clubs and is the one in use; give it a different driver.
  await page.getByTestId('bag-add').click();
  await expect(bagButtons(page)).toHaveCount(2);
  await expect(page.getByTestId('bag-2')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('bag-name')).toHaveText('Bag 2');
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Apocalypse, level 3');
  await page.getByTestId('bag-edit').click();
  await pick(page, 'drivers', 'The Extra Mile', 5);
  await page.getByTestId('bag-editor-done').click();
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Extra Mile, level 5');
  await expect(page.getByTestId('result-current')).not.toHaveText(bag1Rings);

  await page.reload();

  // Still on Bag 2, with its own clubs.
  await expect(bagButtons(page)).toHaveCount(2);
  await expect(page.getByTestId('bag-2')).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Extra Mile, level 5');
  await expect(page.getByTestId('detail-level')).toHaveText('5');

  // And Bag 1 kept its own.
  await page.getByTestId('bag-1').click();
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Apocalypse, level 3');
  await expect(page.getByTestId('result-current')).toHaveText(bag1Rings);
  await expect(card(page, 'wedges')).toHaveAccessibleName('Wedge: The Firefly, level 6');
});

test('+ goes once there are five bags', async ({ page }) => {
  await open(page);
  for (let i = 2; i <= 5; i++) {
    await page.getByTestId('bag-add').click();
    await expect(page.getByTestId(`bag-${i}`)).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(bagButtons(page)).toHaveCount(5);
  await expect(page.getByTestId('bag-add')).toHaveCount(0);
});

test('Flex picks any club and level, keeps its own picks, and is remembered', async ({ page }) => {
  await open(page);

  await page.getByTestId('bag-flex').click();
  await expect(page.getByTestId('bag-flex')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('bag-1')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('bag-name')).toHaveText('Any club');
  await expect(page.getByTestId('bag-clubs')).toHaveCount(0);
  await page.getByTestId('club-list-drivers').getByTestId('club-The Apocalypse').click();
  await expect(page.getByTestId('detail-level')).toHaveText('8');

  await page.reload();
  await expect(page.getByTestId('bag-flex')).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByTestId('club-list-drivers').getByTestId('club-The Apocalypse')
  ).toHaveAttribute('aria-pressed', 'true');

  // The bag is untouched.
  await page.getByTestId('bag-1').click();
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Rocket, level 10');
});

test('the bag manager adds, renames, edits, copies, resets and removes bags', async ({ page }) => {
  await open(page);
  await page.getByTestId('bags-manage').click();
  const manager = page.getByTestId('bags-dialog');
  await expect(manager).toBeVisible();

  // With one bag there is nothing to copy to or remove.
  await manager.getByTestId('bag-more-1').click();
  await expect(manager.getByTestId('bag-copy-1')).toHaveCount(0);
  await expect(manager.getByTestId('bag-remove-1')).toHaveCount(0);

  // Add three more; the new bag's name is ready to type over.
  for (let i = 2; i <= 4; i++) {
    await manager.getByTestId('bag-add-manager').click();
    await expect(manager.getByTestId(`bag-name-${i}`)).toBeFocused();
  }
  await expect(bagButtons(page)).toHaveCount(4);

  // Rename Bag 2; the button for it says so to screen readers.
  await manager.getByTestId('bag-name-2').fill('Approach');
  await manager.getByTestId('bag-name-2').press('Enter');
  await expect(page.getByTestId('bag-2')).toHaveAccessibleName('Bag 2: Approach');

  // Edit Bag 1's clubs from the manager; the editor opens on top of it.
  await manager.getByTestId('bag-more-1').click();
  await manager.getByTestId('bag-edit-1').click();
  await pick(page, 'drivers', 'Big Topper', 7);
  await page.getByTestId('bag-editor-done').click();
  await expect(manager).toBeVisible();

  // Copy Bag 1 to Bag 4, which asks first.
  await manager.getByTestId('bag-copy-target-1').selectOption({ label: 'Bag 4' });
  await manager.getByTestId('bag-copy-1').click();
  await expect(manager.getByTestId('bag-copy-confirm')).toContainText('“Bag 4”');
  await manager.getByTestId('bag-copy-yes').click();
  await page.getByTestId('bags-dialog-close').click();

  // The copy has Bag 1's clubs and keeps its own name.
  await page.getByTestId('bag-4').click();
  await expect(page.getByTestId('bag-name')).toHaveText('Bag 4');
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: Big Topper, level 7');

  // Reset Bag 4, which also asks first.
  await page.getByTestId('bags-manage').click();
  await manager.getByTestId('bag-more-4').click();
  await manager.getByTestId('bag-reset-4').click();
  await manager.getByTestId('bag-reset-yes').click();
  await expect(manager).toBeVisible();

  // Remove Bag 2, which asks first. Bags 3 and 4 move up a number.
  await manager.getByTestId('bag-more-2').click();
  await manager.getByTestId('bag-remove-2').click();
  await expect(manager.getByTestId('bag-remove-confirm')).toContainText('“Approach”');
  await manager.getByTestId('bag-remove-yes').click();
  await page.getByTestId('bags-dialog-close').click();

  await expect(bagButtons(page)).toHaveCount(3);
  await expect(page.getByTestId('bag-2')).toHaveAccessibleName('Bag 2');
  // The bag in use was Bag 4, which is Bag 3 now, still reset.
  await expect(page.getByTestId('bag-3')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('bag-name')).toHaveText('Bag 3');
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Rocket, level 10');

  // Bag 1 is unchanged by any of it.
  await page.getByTestId('bag-1').click();
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: Big Topper, level 7');
});

test('picks saved before bags become Bag 1 and the Flex picks', async ({ page }) => {
  // Once only: after the first load the app has written gcwind:v2.
  await page.addInitScript(() => {
    if (localStorage.getItem('gcwind:v2')) return;
    localStorage.setItem(
      'gcwind:v1',
      JSON.stringify({
        clubType: 'woods',
        windSpeed: 14.2,
        powerBall: 6,
        elevation: 20,
        distance: 100,
        selections: { woods: { club: 'The Big Dawg', level: 7 } }
      })
    );
  });
  await open(page);

  await expect(bagButtons(page)).toHaveCount(1);
  await expect(page.getByTestId('bag-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page, 'woods')).toHaveAccessibleName('Wood: The Big Dawg, level 7');
  await expect(card(page, 'woods')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('wind-input')).toHaveValue('14.2');
  await expect(page.getByTestId('detail-powerball')).toHaveText('6');
  await expect(page.getByTestId('detail-elevation')).toHaveText('20%');

  await page.getByTestId('bag-flex').click();
  await expect(
    page.getByTestId('club-list-woods').getByTestId('club-The Big Dawg')
  ).toHaveAttribute('aria-pressed', 'true');

  // The old key stays, so rolling back still finds it.
  await page.reload();
  const keys = await page.evaluate(() => [
    localStorage.getItem('gcwind:v1') !== null,
    localStorage.getItem('gcwind:v2') !== null
  ]);
  expect(keys).toEqual([true, true]);
});

test('damaged storage falls back to defaults without breaking the page', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gcwind:v2', '{"version":2,"accounts":[{"bags":');
  });
  await open(page);

  await expect(page.getByTestId('bag-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('result-current')).toHaveText('8.3');
});

test('edited storage is checked before it is used', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'gcwind:v2',
      JSON.stringify({
        version: 2,
        mode: 'tournament',
        activeAccount: 7,
        accounts: [
          {
            name: 'Main',
            activeBag: 12,
            bags: [
              {
                name: '   ',
                selections: {
                  drivers: { club: 'The Apocalypse', level: 10 },
                  woods: { club: 'A club that does not exist', level: 3 }
                }
              },
              ...Array.from({ length: 6 }, () => ({}))
            ]
          }
        ]
      })
    );
  });
  await open(page);

  // Unknown mode → a bag; bag out of range → Bag 1; seven bags → five; blank
  // name → default.
  await expect(page.getByTestId('bag-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(bagButtons(page)).toHaveCount(5);
  await expect(page.getByTestId('bag-name')).toHaveText('Bag 1');
  // An Epic club stops at level 8; an unknown club falls back to the starter.
  await expect(card(page, 'drivers')).toHaveAccessibleName('Driver: The Apocalypse, level 8');
  await expect(card(page, 'woods')).toHaveAccessibleName('Wood: The Horizon, level 8');
});

test('Flex, bags and club cards work from the keyboard', async ({ page }) => {
  await open(page);

  await page.getByTestId('bag-add').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('bag-2')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('bag-flex').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('bag-flex')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('bag-1').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('bag-1')).toHaveAttribute('aria-pressed', 'true');

  await card(page, 'longirons').focus();
  await page.keyboard.press('Space');
  await expect(card(page, 'longirons')).toHaveAttribute('aria-pressed', 'true');

  // The editor is a native dialog, so Escape closes it.
  await page.getByTestId('bag-edit').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('bag-editor')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('bag-editor')).toBeHidden();
});
