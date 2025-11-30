import { test, expect } from '@playwright/test';

test.describe('Printer Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner first
    await page.goto('/');
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', 'wilson@wilsonpizza.com');
    await page.fill('[data-testid="input-password"]', 'wilson123');
    await page.click('[data-testid="button-login"]');
    await expect(page).toHaveURL(/\/restaurant\/dashboard/);
  });

  test('Enable printer and configure TCP settings', async ({ page }) => {
    // Navigate to settings
    await page.click('[data-testid="link-settings"]');
    await expect(page).toHaveURL(/\/restaurant\/settings/);
    
    // Find printer card
    const printerCard = page.locator('text=Configurações da Impressora');
    await expect(printerCard).toBeVisible();
    
    // Enable printer switch
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // Select TCP type
    await page.selectOption('[data-testid="select-printer-type"]', 'tcp');
    
    // Fill TCP settings
    await page.fill('[data-testid="input-printer-ip"]', '192.168.1.100');
    await page.fill('[data-testid="input-printer-port"]', '9100');
    
    // Enable kitchen printing
    await page.click('[data-testid="switch-print-kitchen"]');
    
    // Save settings
    await page.click('[data-testid="button-save-settings"]');
    
    // Verify success
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });

  test('Disable printer settings', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Toggle printer off
    const printerSwitch = page.locator('[data-testid="switch-printer-enabled"]');
    await printerSwitch.click();
    
    // Conditional fields should disappear
    await expect(page.locator('[data-testid="select-printer-type"]')).not.toBeVisible();
    
    // Save
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });
});
