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

test.describe('Kanban Limit & Boundary Tests', () => {
  test.beforeEach(async ({ page }) => {
    resetBoardFile();
    await page.goto('/');
  });

  test('handles extremely long card title and multi-paragraph details without layout breaking', async ({
    page,
  }) => {
    const longTitle =
      'Super Long Feature Title '.repeat(10).trim(); // ~250 characters
    const multiLineDetails =
      'Line 1: Detailed specification requirements.\n' +
      'Line 2: Edge cases and exception handling strategies.\n' +
      'Line 3: Performance metrics and benchmark analysis.\n' +
      'Line 4: Final verification and sign-off criteria.';

    await page.getByTestId('add-card-button-col-1').click();
    await page.getByTestId('card-title-input').fill(longTitle);
    await page.getByTestId('card-details-input').fill(multiLineDetails);
    await page.getByTestId('submit-add-card-button').click();

    // Verify card is rendered and wrapped cleanly
    const newCard = page.getByRole('heading', { name: longTitle });
    await expect(newCard).toBeVisible();

    const detailsElement = page.getByText('Line 1: Detailed specification requirements.');
    await expect(detailsElement).toBeVisible();

    // Verify card container dimensions remain constrained
    const cardBox = await newCard.boundingBox();
    expect(cardBox).toBeTruthy();
    if (cardBox) {
      expect(cardBox.width).toBeLessThan(350); // within column bounds
    }
  });

  test('safely handles special characters, symbols, and HTML entities', async ({
    page,
  }) => {
    const specialTitle = 'Test <script>alert("xss")</script> & "quotes" + [brackets] / \\';
    const specialDetails = 'Symbols: #$%^&*()_+=~`{}|:;<>?,./ and accents: áéíóú ñ ç';

    await page.getByTestId('add-card-button-col-2').click();
    await page.getByTestId('card-title-input').fill(specialTitle);
    await page.getByTestId('card-details-input').fill(specialDetails);
    await page.getByTestId('submit-add-card-button').click();

    // Verify rendered text is escaped and safely displayed as plain text
    await expect(page.getByRole('heading', { name: specialTitle })).toBeVisible();
    await expect(page.getByText(specialDetails)).toBeVisible();
  });

  test('stress test: adds multiple cards sequentially to test column scalability', async ({
    page,
  }) => {
    const initialCount = 2; // col-1 starts with 2 cards
    const cardsToAdd = 5;

    for (let i = 1; i <= cardsToAdd; i++) {
      await page.getByTestId('add-card-button-col-1').click();
      await page.getByTestId('card-title-input').fill(`Bulk Task #${i}`);
      await page.getByTestId('submit-add-card-button').click();
      await expect(page.getByRole('heading', { name: `Bulk Task #${i}` })).toBeVisible();
    }

    await expect(page.getByTestId('column-count-col-1')).toHaveText(
      String(initialCount + cardsToAdd)
    );
  });

  test('boundary test: rejects pure whitespace across title and rename inputs', async ({
    page,
  }) => {
    // 1. Add card with whitespace
    await page.getByTestId('add-card-button-col-3').click();
    const titleInput = page.getByTestId('card-title-input');
    const submitBtn = page.getByTestId('submit-add-card-button');

    await titleInput.fill('       ');
    await expect(submitBtn).toBeDisabled();
    await page.getByTestId('cancel-add-card-button').click();

    // 2. Rename column with whitespace
    const trigger = page.getByTestId('column-title-trigger-col-3');
    await trigger.click();
    const renameInput = page.getByTestId('column-title-input-col-3');
    await renameInput.fill('    ');
    await renameInput.press('Enter');

    // Title should revert/remain unchanged
    await expect(page.getByRole('heading', { name: 'In Progress' })).toBeVisible();
  });

  test('rapid modal toggle resilience: withstands fast consecutive open/close triggers', async ({
    page,
  }) => {
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('add-card-button-col-1').click();
      await expect(page.getByTestId('add-card-modal')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('add-card-modal')).not.toBeVisible();
    }
  });
});
