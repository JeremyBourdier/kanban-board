import { test, expect } from '@playwright/test';

test.describe('OAuth Authentication Modal & Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('renders Iniciar Sesión button in header', async ({ page }) => {
    const loginBtn = page.locator('#open-login-btn');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toContainText('Iniciar Sesión');
  });

  test('opens AuthModal with Google and GitHub login options', async ({ page }) => {
    const loginBtn = page.locator('#open-login-btn');
    await loginBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Iniciar Sesión');

    const googleBtn = page.locator('#google-signin-btn');
    const githubBtn = page.locator('#github-signin-btn');

    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toContainText('Continuar con Google');

    await expect(githubBtn).toBeVisible();
    await expect(githubBtn).toContainText('Continuar con GitHub');
  });

  test('closes AuthModal via close button and Escape key', async ({ page }) => {
    const loginBtn = page.locator('#open-login-btn');
    await loginBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close via close button
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
