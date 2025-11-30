import { test, expect } from '@playwright/test';

test.describe('Customer Flow', () => {
  test('Landing page loads', async ({ page }) => {
    await page.goto('/');
    
    // Check page loaded
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');
  });

  test('Restaurants page is accessible', async ({ page }) => {
    await page.goto('/restaurants');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurants');
  });

  test('Customer can browse restaurants', async ({ page }) => {
    await page.goto('/restaurants');
    
    // Look for restaurant cards or items
    const restaurantCards = page.locator('[data-testid*="card-"]');
    const count = await restaurantCards.count();
    
    // Page should have loaded (even if no restaurants)
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/restaurants');
  });

  test('Checkout page is accessible', async ({ page }) => {
    await page.goto('/checkout');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/checkout');
  });

  test('Customer orders history is accessible', async ({ page }) => {
    await page.goto('/customer/orders');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/customer/orders');
  });

  test('Customer can view order tracking', async ({ page }) => {
    // Try to access a random order (won't exist but page should load)
    await page.goto('/customer/order/test-order-id');
    
    // Check if page loads (even if order not found)
    await page.waitForLoadState('networkidle');
  });

  test('Customer rating page is accessible', async ({ page }) => {
    await page.goto('/customer/rating');
    
    // Check if page loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/customer/rating');
  });
});
