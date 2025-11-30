import { test, expect } from '@playwright/test';

test.describe('Restaurant Owner Flow', () => {
  test('Restaurant dashboard is accessible', async ({ page }) => {
    await page.goto('/restaurant/dashboard');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/dashboard');
  });

  test('Products management page is accessible', async ({ page }) => {
    await page.goto('/restaurant/products');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/products');
  });

  test('Orders management page is accessible', async ({ page }) => {
    await page.goto('/restaurant/orders');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/orders');
  });

  test('Financials page is accessible', async ({ page }) => {
    await page.goto('/restaurant/financials');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/financials');
  });

  test('Settings page is accessible', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/settings');
  });

  test('Integrations page is accessible', async ({ page }) => {
    await page.goto('/restaurant/integrations');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/integrations');
  });

  test('Analytics dashboard is accessible', async ({ page }) => {
    await page.goto('/restaurant/analytics');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/analytics');
  });

  test('Promotions page is accessible', async ({ page }) => {
    await page.goto('/restaurant/promotions');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/promotions');
  });

  test('Ratings page is accessible', async ({ page }) => {
    await page.goto('/restaurant/ratings');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/ratings');
  });

  test('Driver map is accessible', async ({ page }) => {
    await page.goto('/restaurant/driver-map');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurant/driver-map');
  });
});
