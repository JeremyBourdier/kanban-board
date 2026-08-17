import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './test-helpers';

test.describe('Protected Board, Authorization & GitHub OAuth Suite', () => {
  test('shows login hero and protects board when user is not authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

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

  test('blocks non-authorized GitHub users and displays AccessDeniedHero', async ({ page }) => {
    // Simulate someone logging in with a non-whitelisted GitHub account
    await mockAuthenticatedUser(page, {
      name: 'Unauthorized Stranger',
      email: 'stranger@randomcorp.com',
      userName: 'randomstranger',
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Board columns should NOT be visible
    await expect(page.locator('[data-testid="kanban-board-container"]')).not.toBeVisible();

    // Access Denied screen should be visible
    const deniedHero = page.locator('[data-testid="access-denied-container"]');
    await expect(deniedHero).toBeVisible();
    await expect(deniedHero.locator('h2')).toContainText('Cuenta No Autorizada');
    await expect(deniedHero.locator('#access-denied-logout-btn')).toBeVisible();
  });

  test('unlocks full board when authorized owner logs in', async ({ page }) => {
    // Simulate authorized owner login
    await mockAuthenticatedUser(page, {
      name: 'Jeremy Bourdier',
      email: 'bourdierestrellajeremy@gmail.com',
      userName: 'JeremyBourdier',
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Full board columns should be visible
    await expect(page.locator('[data-testid="kanban-board-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="access-denied-container"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="login-hero-container"]')).not.toBeVisible();

    // User profile in header shows owner name
    await expect(page.locator('#user-menu-btn')).toBeVisible();
    await expect(page.locator('#user-menu-btn')).toContainText('Jeremy Bourdier');
  });

  test('opens AuthModal with only GitHub OAuth option (no Google)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

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
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

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
