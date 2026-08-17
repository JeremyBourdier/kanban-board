import { test, expect } from '@playwright/test';
import { initialBoardData } from '../src/data/initialData';

test.describe('Kanban Unit & Data Contract Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('validates initial board data integrity and 5 fixed columns', async ({ page }) => {
    expect(initialBoardData.columns).toHaveLength(5);

    const expectedColumnIds = ['col-1', 'col-2', 'col-3', 'col-4', 'col-5'];
    const expectedTitles = ['Backlog', 'Ready', 'In Progress', 'In Review', 'Done'];

    initialBoardData.columns.forEach((col, idx) => {
      expect(col.id).toBe(expectedColumnIds[idx]);
      expect(col.title).toBe(expectedTitles[idx]);
      expect(Array.isArray(col.cards)).toBe(true);
      col.cards.forEach((card) => {
        expect(card.id).toBeTruthy();
        expect(card.title.trim().length).toBeGreaterThan(0);
        expect(typeof card.details).toBe('string');
      });
    });

    // Check DOM matches initial structure
    for (const title of expectedTitles) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }
  });

  test('validates theme state and CSS variable propagation in the DOM', async ({ page }) => {
    // Light mode CSS variables
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    const lightBgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim();
    });
    expect(lightBgColor).toBe('#f4f7fb');

    // Toggle to Dark mode
    await page.getByTestId('theme-toggle-button').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    const darkBgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim();
    });
    expect(darkBgColor).toBe('#09090b');

    // LocalStorage validation
    const storedTheme = await page.evaluate(() => localStorage.getItem('kanban_theme'));
    expect(storedTheme).toBe('dark');
  });

  test('validates dynamic header task calculation logic', async ({ page }) => {
    const initialTaskCount = initialBoardData.columns.reduce(
      (acc, col) => acc + col.cards.length,
      0
    );
    await expect(page.getByText(`${initialTaskCount} Tasks`)).toBeVisible();

    // Add a card
    await page.getByTestId('add-card-button-col-1').click();
    await page.getByTestId('card-title-input').fill('Unit Test Task');
    await page.getByTestId('submit-add-card-button').click();

    await expect(page.getByText(`${initialTaskCount + 1} Tasks`)).toBeVisible();

    // Delete a card
    await page.getByTestId('delete-card-card-1').click();
    await expect(page.getByText(`${initialTaskCount} Tasks`)).toBeVisible();
  });
});
