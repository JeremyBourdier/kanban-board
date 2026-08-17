import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { initialBoardData } from '../src/data/initialData';

function resetBoardFile() {
  const rootPath = path.resolve(process.cwd(), '../kanban.json');
  const localPath = path.resolve(process.cwd(), 'kanban.json');
  const target = fs.existsSync(rootPath) ? rootPath : localPath;
  fs.writeFileSync(target, JSON.stringify(initialBoardData, null, 2), 'utf-8');
}

test.describe('Kanban Board End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    resetBoardFile();
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
