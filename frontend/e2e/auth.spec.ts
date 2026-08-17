import { test, expect } from '@playwright/test';

test.describe('Protected Board & GitHub OAuth Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows login hero and protects board when user is not authenticated', async ({ page }) => {
    // Board columns should not be visible
    await expect(page.locator('[data-testid="kanban-board-container"]')).not.toBeVisible();

    // Login Hero should be prominently displayed
    const hero = page.locator('[data-testid="login-hero-container"]');
    await expect(hero).toBeVisible();
    await expect(hero.locator('h2')).toContainText('Project Board');
    await expect(hero.locator('#hero-github-login-btn')).toBeVisible();
    await expect(hero.locator('#hero-github-login-btn')).toContainText('Continuar con GitHub');

    // Header has Iniciar Sesión button
    const loginBtn = page.locator('#open-login-btn');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toContainText('Iniciar Sesión');
  });

  test('opens AuthModal with only GitHub OAuth option (no Google)', async ({ page }) => {
    const loginBtn = page.locator('#open-login-btn');
    await loginBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Iniciar Sesión');

    const githubBtn = modal.locator('#github-signin-btn');
    await expect(githubBtn).toBeVisible();
    await expect(githubBtn).toContainText('Continuar con GitHub');

    // Google button must NOT exist
    const googleBtn = modal.locator('#google-signin-btn');
    await expect(googleBtn).toHaveCount(0);
  });

  test('closes AuthModal via close button and Escape key', async ({ page }) => {
    const loginBtn = page.locator('#open-login-btn');
    await loginBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close via X button
    const closeBtn = modal.locator('button[aria-label="Cerrar modal"]');
    await closeBtn.click();
    await expect(modal).toBeHidden();

    // Reopen and close via Escape
    await loginBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });
});
