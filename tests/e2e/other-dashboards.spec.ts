import { test, expect } from '@playwright/test';

test.describe('Other Dashboards', () => {
  test('Driver dashboard is accessible', async ({ page }) => {
    await page.goto('/driver/dashboard');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/driver/dashboard');
  });

  test('Kitchen dashboard is accessible', async ({ page }) => {
    await page.goto('/kitchen/dashboard');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/kitchen/dashboard');
  });

  test('Delivery dashboard is accessible', async ({ page }) => {
    await page.goto('/delivery/dashboard');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
  });

  test('Order confirmation page is accessible', async ({ page }) => {
    await page.goto('/order-confirmation');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/order-confirmation');
  });

  test('Not found page displays', async ({ page }) => {
    await page.goto('/non-existent-page-xyz');
    
    // Page should load (even if 404)
    await page.waitForLoadState('networkidle');
  });
});
