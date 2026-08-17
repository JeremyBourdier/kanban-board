import { test, expect } from '@playwright/test';
import { initialBoardData } from '../src/data/initialData';
import { mockAuthenticatedUser } from './test-helpers';

test.describe('Kanban AI Assistant Chat Suite', () => {
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

    await page.route('**/api/chat', async (route) => {
      const body = route.request().postDataJSON();
      const lastMsg = body.messages[body.messages.length - 1];
      let reply = 'Respuesta simulada del asistente para: ' + lastMsg.content;
      if (lastMsg.content.includes('resumen')) {
        reply = '### Resumen Actual del Tablero Kanban\n- Total de tareas registradas: 6';
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: {
            id: `mock-${Date.now()}`,
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto('/');
  });

  test('opens and closes chat drawer using floating button and close icon', async ({ page }) => {
    const floatBtn = page.getByTestId('chat-floating-button');
    await expect(floatBtn).toBeVisible();

    // Open chat
    await floatBtn.click();
    const chatDrawer = page.getByTestId('chat-drawer');
    await expect(chatDrawer).toBeVisible();

    // Close chat using close button
    const closeBtn = page.getByTestId('chat-close-btn');
    await closeBtn.click();
    await expect(chatDrawer).not.toBeVisible();
  });

  test('opens chat from header button', async ({ page }) => {
    const headerChatBtn = page.getByTestId('header-chat-button');
    await expect(headerChatBtn).toBeVisible();

    await headerChatBtn.click();
    const chatDrawer = page.getByTestId('chat-drawer');
    await expect(chatDrawer).toBeVisible();
  });

  test('sends a user message and receives an assistant response', async ({ page }) => {
    await page.getByTestId('chat-floating-button').click();

    const input = page.getByTestId('chat-input');
    const sendBtn = page.getByTestId('chat-send-btn');

    await input.fill('¿Cuál es el resumen del tablero?');
    await sendBtn.click();

    // Verify user message appears in messages list
    const messagesList = page.getByTestId('chat-messages-list');
    await expect(messagesList.getByText('¿Cuál es el resumen del tablero?')).toBeVisible();

    // Verify assistant response appears
    await expect(messagesList.getByText('Resumen Actual del Tablero Kanban')).toBeVisible();
  });

  test('clicking suggestion chip sends prompt directly', async ({ page }) => {
    await page.getByTestId('chat-floating-button').click();

    const chip = page.getByTestId('chat-chip-0');
    await expect(chip).toBeVisible();
    await chip.click();

    // User message is populated and sent
    const messagesList = page.getByTestId('chat-messages-list');
    await expect(messagesList).toContainText('¿Cómo está estructurado el código?');
  });

  test('clears conversation history when clicking trash button', async ({ page }) => {
    await page.getByTestId('chat-floating-button').click();

    const input = page.getByTestId('chat-input');
    await input.fill('Mensaje de prueba');
    await page.getByTestId('chat-send-btn').click();

    const userMsg = page.getByTestId('chat-message-user').getByText('Mensaje de prueba');
    await expect(userMsg).toBeVisible();

    // Clear history
    await page.getByTestId('chat-clear-btn').click();
    await expect(userMsg).not.toBeVisible();
    await expect(page.getByTestId('chat-messages-list')).toContainText('Antigravity');
  });
});
