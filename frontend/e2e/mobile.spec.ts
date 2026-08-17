import { test, expect } from '@playwright/test';
import { initialBoardData } from '../src/data/initialData';
import { mockAuthenticatedUser } from './test-helpers';

test.describe('Mobile-First Responsive Kanban Suite', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // Standard mobile viewport

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
    let boardState = JSON.parse(JSON.stringify(initialBoardData));
    await page.route('**/api/board', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(boardState),
        });
      } else if (route.request().method() === 'POST') {
        boardState = route.request().postDataJSON();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, board: boardState }),
        });
      }
      return route.continue();
    });
    await page.goto('/');
  });

  test('renders mobile column navigation bar with pill buttons for all 5 columns', async ({
    page,
  }) => {
    const mobileNav = page.getByTestId('mobile-column-nav');
    await expect(mobileNav).toBeVisible();

    const expectedCols = ['col-1', 'col-2', 'col-3', 'col-4', 'col-5'];
    for (const colId of expectedCols) {
      await expect(page.getByTestId(`mobile-col-pill-${colId}`)).toBeVisible();
    }

    // Default active pill is col-1
    await expect(page.getByTestId('mobile-col-pill-col-1')).toHaveClass(/mobileColPillActive/);

    // Clicking col-3 activates col-3 pill
    await page.getByTestId('mobile-col-pill-col-3').click();
    await expect(page.getByTestId('mobile-col-pill-col-3')).toHaveClass(/mobileColPillActive/);
  });

  test('moves a card across columns using mobile quick-move select dropdown', async ({
    page,
  }) => {
    // Check initial state: card-1 is in Backlog (col-1)
    await expect(page.getByTestId('column-count-col-1')).toHaveText('2');
    await expect(page.getByTestId('column-count-col-5')).toHaveText('2');

    const moveSelect = page.getByTestId('move-card-select-card-1');
    await expect(moveSelect).toBeVisible();
    await expect(moveSelect).toHaveValue('col-1');

    // Move to Done (col-5)
    await moveSelect.selectOption('col-5');

    // Verify card moved and column counters updated
    await expect(page.getByTestId('column-count-col-1')).toHaveText('1');
    await expect(page.getByTestId('column-count-col-5')).toHaveText('3');
  });

  test('opens add card modal in mobile bottom sheet layout and creates task', async ({ page }) => {
    const addBtn = page.getByTestId('add-card-button-col-1');
    await addBtn.click();

    const modal = page.getByTestId('add-card-modal');
    await expect(modal).toBeVisible();

    const titleInput = page.getByTestId('card-title-input');
    const detailsInput = page.getByTestId('card-details-input');
    const submitBtn = page.getByTestId('submit-add-card-button');

    await titleInput.fill('Mobile Touch Card');
    await detailsInput.fill('Tested with 375px mobile viewport.');
    await submitBtn.click();

    await expect(modal).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mobile Touch Card' })).toBeVisible();
  });

  test('opens edit card modal on mobile and edits details', async ({ page }) => {
    const editBtn = page.getByTestId('edit-card-card-1');
    await editBtn.click();

    const modal = page.getByTestId('edit-card-modal');
    await expect(modal).toBeVisible();

    const titleInput = page.getByTestId('edit-card-title-input');
    await titleInput.fill('Mobile Edited Card Title');
    await page.getByTestId('submit-edit-card-button').click();

    await expect(modal).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mobile Edited Card Title' })).toBeVisible();
  });
});
