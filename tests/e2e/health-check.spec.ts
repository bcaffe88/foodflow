import { test, expect } from '@playwright/test';

test('Health check - Server is running', async ({ request }) => {
  const response = await request.get('http://localhost:5000/api/health');
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.status).toBe('ok');
});

test('Frontend loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=FoodFlow')).toBeVisible();
});
