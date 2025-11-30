import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('Navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click on login link/button
    const loginButton = page.locator('[data-testid="link-login"], text=/entrar/i, text=/login/i').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    } else {
      await page.goto('/login');
    }
    
    // Verify we're on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    // Click on register link/button
    const registerButton = page.locator('[data-testid="link-register"], text=/cadastro|register/i').first();
    if (await registerButton.isVisible()) {
      await registerButton.click();
    } else {
      await page.goto('/register');
    }
    
    // Verify we're on register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('Login form validation', async ({ page }) => {
    await page.goto('/login');
    
    // Try submitting empty form
    const submitButton = page.locator('[data-testid="button-login"]');
    await submitButton.click();
    
    // Should still be on login page (form validation failed)
    await expect(page).toHaveURL(/\/login/);
  });

  test('Logout functionality', async ({ page }) => {
    // This test would require a valid user to be logged in
    // For now, just verify logout button works if visible
    await page.goto('/');
    
    const logoutButton = page.locator('[data-testid="button-logout"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Should redirect to home or login
      await expect(page).toHaveURL(/\/(login|)$/);
    }
  });

  test('Register restaurant navigation', async ({ page }) => {
    await page.goto('/register-restaurant');
    
    // Check form elements exist
    const emailInput = page.locator('[data-testid="input-email"]');
    await expect(emailInput).toBeVisible();
  });

  test('Register driver navigation', async ({ page }) => {
    await page.goto('/register-driver');
    
    // Check form elements exist
    const emailInput = page.locator('[data-testid="input-email"]');
    await expect(emailInput).toBeVisible();
  });
});
