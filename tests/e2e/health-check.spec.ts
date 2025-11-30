import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('Server is running and healthy', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/health');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('Landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check main title exists
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    // Check navigation exists
    const navLink = page.locator('a, button').first();
    await expect(navLink).toBeVisible();
  });

  test('Login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email input
    const emailInput = page.locator('[data-testid="input-email"]');
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.locator('[data-testid="input-password"]');
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button
    const submitButton = page.locator('[data-testid="button-login"]');
    await expect(submitButton).toBeVisible();
  });

  test('Register page is accessible', async ({ page }) => {
    await page.goto('/register');
    
    // Check for form elements
    const emailInput = page.locator('[data-testid="input-email"]');
    await expect(emailInput).toBeVisible();
  });
});
