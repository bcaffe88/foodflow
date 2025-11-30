import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('Owner login - wilson@wilsonpizza.com', async ({ page }) => {
    // Navigate to login
    await page.goto('/');
    await page.click('text=Entrar');
    
    // Fill login form
    await page.fill('[data-testid="input-email"]', 'wilson@wilsonpizza.com');
    await page.fill('[data-testid="input-password"]', 'wilson123');
    await page.click('[data-testid="button-login"]');
    
    // Verify dashboard loaded
    await expect(page).toHaveURL(/\/restaurant\/dashboard/);
    await expect(page.locator('[data-testid="text-restaurant-name"]')).toBeVisible();
  });

  test('Driver login - driver@example.com', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Entrar');
    
    await page.fill('[data-testid="input-email"]', 'driver@example.com');
    await page.fill('[data-testid="input-password"]', 'driver123');
    await page.click('[data-testid="button-login"]');
    
    // Driver should see driver dashboard
    await expect(page).toHaveURL(/\/driver\/dashboard/);
  });

  test('Customer login - customer@example.com', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Entrar');
    
    await page.fill('[data-testid="input-email"]', 'customer@example.com');
    await page.fill('[data-testid="input-password"]', 'password');
    await page.click('[data-testid="button-login"]');
    
    // Customer should see storefront
    await expect(page).toHaveURL(/\/storefront/);
  });

  test('Logout functionality', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Entrar');
    
    await page.fill('[data-testid="input-email"]', 'wilson@wilsonpizza.com');
    await page.fill('[data-testid="input-password"]', 'wilson123');
    await page.click('[data-testid="button-login"]');
    
    // Click logout
    await page.click('[data-testid="button-logout"]');
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
  });
});
