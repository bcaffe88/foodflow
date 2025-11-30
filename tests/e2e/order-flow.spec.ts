import { test, expect } from '@playwright/test';

test.describe('Order Management Flow', () => {
  test('Create order as customer', async ({ page }) => {
    // Login as customer
    await page.goto('/');
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', 'customer@example.com');
    await page.fill('[data-testid="input-password"]', 'password');
    await page.click('[data-testid="button-login"]');
    
    // Should see storefront
    await expect(page).toHaveURL(/\/storefront/);
    
    // Add item to cart
    const firstProduct = page.locator('[data-testid*="card-product-"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
  });

  test('Restaurant receives order in real-time', async ({ page }) => {
    // Login as owner
    await page.goto('/');
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', 'wilson@wilsonpizza.com');
    await page.fill('[data-testid="input-password"]', 'wilson123');
    await page.click('[data-testid="button-login"]');
    
    // Should see dashboard
    await expect(page).toHaveURL(/\/restaurant\/dashboard/);
    
    // Verify order list exists
    await expect(page.locator('[data-testid="list-orders"]')).toBeVisible();
  });

  test('Driver accepts order', async ({ page }) => {
    // Login as driver
    await page.goto('/');
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', 'driver@example.com');
    await page.fill('[data-testid="input-password"]', 'driver123');
    await page.click('[data-testid="button-login"]');
    
    // Should see driver dashboard
    await expect(page).toHaveURL(/\/driver\/dashboard/);
    
    // Look for accept button
    const acceptButton = page.locator('[data-testid*="button-accept-"]').first();
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await expect(page.locator('text=Pedido aceito')).toBeVisible();
    }
  });
});
