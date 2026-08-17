import { test, expect } from '@playwright/test';
import { initialBoardData } from '../src/data/initialData';
import { mockAuthenticatedUser } from './test-helpers';

test.describe('Kanban Board End-to-End Suite', () => {
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

  test.describe('Board Initialization & Default State', () => {
    test('renders board header, branding, stats counters, and 5 columns', async ({
      page,
    }) => {
      await expect(page.getByRole('heading', { name: 'Project Board' })).toBeVisible();
      await expect(page.getByText('5 Columns')).toBeVisible();
      await expect(page.getByText('8 Tasks')).toBeVisible();

      const expectedColumns = ['Backlog', 'Ready', 'In Progress', 'In Review', 'Done'];
      for (const colTitle of expectedColumns) {
        await expect(page.getByRole('heading', { name: colTitle })).toBeVisible();
      }

      // Check dummy cards are pre-populated
      await expect(page.getByRole('heading', { name: 'Implement Dark Mode Toggle' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Project Scaffolding' })).toBeVisible();
    });
  });

  test.describe('Theme Switching & Persistence', () => {
    test('toggles dark and light mode and persists across reload', async ({ page }) => {
      const themeBtn = page.getByTestId('theme-toggle-button');
      await expect(themeBtn).toBeVisible();

      // Switch to dark mode
      await themeBtn.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      // Reload page and confirm dark mode persistence
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

      // Switch back to light mode
      const themeBtnAfterReload = page.getByTestId('theme-toggle-button');
      await themeBtnAfterReload.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
  });

  test.describe('Column Renaming & Interactions', () => {
    test('renames column via Enter key', async ({ page }) => {
      const trigger = page.getByTestId('column-title-trigger-col-1');
      await trigger.click();

      const input = page.getByTestId('column-title-input-col-1');
      await expect(input).toBeVisible();
      await input.fill('Backlog (Sprint 42)');
      await input.press('Enter');

      await expect(page.getByRole('heading', { name: 'Backlog (Sprint 42)' })).toBeVisible();
    });

    test('cancels column rename via Escape key', async ({ page }) => {
      const trigger = page.getByTestId('column-title-trigger-col-2');
      await trigger.click();

      const input = page.getByTestId('column-title-input-col-2');
      await input.fill('Temporary Unsaved Name');
      await input.press('Escape');

      await expect(page.getByRole('heading', { name: 'Ready' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Temporary Unsaved Name' })).not.toBeVisible();
    });

    test('ignores empty title input on column rename', async ({ page }) => {
      const trigger = page.getByTestId('column-title-trigger-col-3');
      await trigger.click();

      const input = page.getByTestId('column-title-input-col-3');
      await input.fill('   ');
      await input.press('Enter');

      await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible();
    });
  });

  test.describe('Card Lifecycle: Creation & Deletion', () => {
    test('dismisses Add Card modal using all close triggers', async ({ page }) => {
      const addBtn = page.getByTestId('add-card-button-col-1');
      const modal = page.getByTestId('add-card-modal');

      // 1. Close via X button
      await addBtn.click();
      await expect(modal).toBeVisible();
      await page.getByTestId('modal-close-button').click();
      await expect(modal).not.toBeVisible();

      // 2. Close via Cancel button
      await addBtn.click();
      await expect(modal).toBeVisible();
      await page.getByTestId('cancel-add-card-button').click();
      await expect(modal).not.toBeVisible();

      // 3. Close via Escape key
      await addBtn.click();
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();

      // 4. Close via backdrop overlay click
      await addBtn.click();
      await expect(modal).toBeVisible();
      await page.getByTestId('add-card-modal-overlay').click({ position: { x: 5, y: 5 } });
      await expect(modal).not.toBeVisible();
    });

    test('validates card form and creates new card with title and details', async ({ page }) => {
      await expect(page.getByText('8 Tasks')).toBeVisible();
      await expect(page.getByTestId('column-count-col-1')).toHaveText('2');

      const addBtn = page.getByTestId('add-card-button-col-1');
      await addBtn.click();

      const titleInput = page.getByTestId('card-title-input');
      const detailsInput = page.getByTestId('card-details-input');
      const submitBtn = page.getByTestId('submit-add-card-button');

      // Submit is disabled with empty title
      await expect(submitBtn).toBeDisabled();
      await titleInput.fill('   ');
      await expect(submitBtn).toBeDisabled();

      // Fill valid content
      await titleInput.fill('Automated E2E Testing');
      await detailsInput.fill('Comprehensive multi-browser test coverage.');
      await expect(submitBtn).toBeEnabled();

      await submitBtn.click();

      // Verify card was added
      await expect(page.getByTestId('add-card-modal')).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Automated E2E Testing' })).toBeVisible();
      await expect(page.getByText('Comprehensive multi-browser test coverage.')).toBeVisible();

      // Verify counter badges updated
      await expect(page.getByText('9 Tasks')).toBeVisible();
      await expect(page.getByTestId('column-count-col-1')).toHaveText('3');
    });

    test('deletes an existing card and updates metrics', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Audit Accessibility Compliance' })).toBeVisible();
      await expect(page.getByText('8 Tasks')).toBeVisible();
      await expect(page.getByTestId('column-count-col-1')).toHaveText('2');

      const deleteBtn = page.getByTestId('delete-card-card-2');
      await deleteBtn.click();

      await expect(page.getByRole('heading', { name: 'Audit Accessibility Compliance' })).not.toBeVisible();
      await expect(page.getByText('7 Tasks')).toBeVisible();
      await expect(page.getByTestId('column-count-col-1')).toHaveText('1');
    });

    test('dismisses Edit Card modal using all close triggers without changing card data', async ({ page }) => {
      const editBtn = page.getByTestId('edit-card-card-1');
      const modal = page.getByTestId('edit-card-modal');

      // 1. Close via X button
      await editBtn.click();
      await expect(modal).toBeVisible();
      await page.getByTestId('edit-modal-close-button').click();
      await expect(modal).not.toBeVisible();

      // 2. Close via Cancel button
      await editBtn.click();
      await expect(modal).toBeVisible();
      await page.getByTestId('cancel-edit-card-button').click();
      await expect(modal).not.toBeVisible();

      // 3. Close via Escape key
      await editBtn.click();
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();

      // Original card still intact
      await expect(page.getByRole('heading', { name: 'Implement Dark Mode Toggle' })).toBeVisible();
    });

    test('opens edit modal with prefilled data, modifies title and details, and saves changes', async ({ page }) => {
      const editBtn = page.getByTestId('edit-card-card-1');
      await editBtn.click();

      const modal = page.getByTestId('edit-card-modal');
      await expect(modal).toBeVisible();

      const titleInput = page.getByTestId('edit-card-title-input');
      const detailsInput = page.getByTestId('edit-card-details-input');
      const submitBtn = page.getByTestId('submit-edit-card-button');

      // Check prefilled values
      await expect(titleInput).toHaveValue('Implement Dark Mode Toggle');
      await expect(detailsInput).toHaveValue('Add theme switcher support across all dashboard views and components.');

      // Update values
      await titleInput.fill('Updated Dark Mode Toggle');
      await detailsInput.fill('Refined high contrast colors and smooth transition.');
      await submitBtn.click();

      // Verify modal closed and updated card content is displayed
      await expect(modal).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Updated Dark Mode Toggle' })).toBeVisible();
      await expect(page.getByText('Refined high contrast colors and smooth transition.')).toBeVisible();

      // Total count remains 8 Tasks
      await expect(page.getByText('8 Tasks')).toBeVisible();
    });

    test('edits card by double clicking card item', async ({ page }) => {
      const card = page.getByTestId('kanban-card-card-2');
      await card.dblclick();

      const modal = page.getByTestId('edit-card-modal');
      await expect(modal).toBeVisible();

      const titleInput = page.getByTestId('edit-card-title-input');
      await titleInput.fill('Double-Click Edited Card');
      await page.getByTestId('submit-edit-card-button').click();

      await expect(modal).not.toBeVisible();
      await expect(page.getByRole('heading', { name: 'Double-Click Edited Card' })).toBeVisible();
    });
  });

  test.describe('Drag and Drop Movements', () => {
    test('moves card from one column to another', async ({ page }) => {
      const sourceCard = page.getByTestId('kanban-card-card-3');
      const targetColumn = page.getByTestId('kanban-column-col-3');

      await expect(sourceCard).toBeVisible();
      await expect(page.getByTestId('column-count-col-2')).toHaveText('1');
      await expect(page.getByTestId('column-count-col-3')).toHaveText('2');

      // Focus card and move using deterministic keyboard drag action
      await sourceCard.focus();
      await page.keyboard.press('Space');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Space');

      // Verify destination column now contains the card and count updated
      await expect(targetColumn.getByRole('heading', { name: 'Refactor Column Drag Context' })).toBeVisible();
      await expect(page.getByTestId('column-count-col-2')).toHaveText('0');
      await expect(page.getByTestId('column-count-col-3')).toHaveText('3');
    });
  });

  test.describe('Keyboard Accessibility', () => {
    test('triggers column edit mode and creates card using keyboard navigation', async ({ page }) => {
      const trigger = page.getByTestId('column-title-trigger-col-4');
      await trigger.focus();
      await page.keyboard.press('Enter');

      const input = page.getByTestId('column-title-input-col-4');
      await expect(input).toBeFocused();
      await input.fill('QA Review');
      await page.keyboard.press('Enter');

      await expect(page.getByRole('heading', { name: 'QA Review' })).toBeVisible();
    });
  });
});
