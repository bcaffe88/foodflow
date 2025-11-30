import { test, expect } from '@playwright/test';

test.describe('Printer Settings Flow - Complete Service Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner first
    await page.goto('/');
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', 'wilson@wilsonpizza.com');
    await page.fill('[data-testid="input-password"]', 'wilson123');
    await page.click('[data-testid="button-login"]');
    await expect(page).toHaveURL(/\/restaurant\/dashboard/);
  });

  test('Enable printer and configure TCP/IP settings', async ({ page }) => {
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
    
    // Verify TCP fields are visible
    await expect(page.locator('[data-testid="input-printer-ip"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-printer-port"]')).toBeVisible();
    
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

  test('Configure USB printer (no extra fields needed)', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Enable printer
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // Select USB type
    await page.selectOption('[data-testid="select-printer-type"]', 'usb');
    
    // TCP fields should NOT be visible for USB
    await expect(page.locator('[data-testid="input-printer-ip"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="input-printer-port"]')).not.toBeVisible();
    
    // Webhook fields should NOT be visible
    await expect(page.locator('[data-testid="input-printer-webhook-url"]')).not.toBeVisible();
    
    // Save
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });

  test('Configure Bluetooth printer (no extra fields needed)', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Enable printer
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // Select Bluetooth type
    await page.selectOption('[data-testid="select-printer-type"]', 'bluetooth');
    
    // TCP fields should NOT be visible
    await expect(page.locator('[data-testid="input-printer-ip"]')).not.toBeVisible();
    
    // Webhook fields should NOT be visible
    await expect(page.locator('[data-testid="input-printer-webhook-url"]')).not.toBeVisible();
    
    // Save
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });

  test('Configure Webhook (Online) printer with URL and secret', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Enable printer
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // Select Webhook type
    await page.selectOption('[data-testid="select-printer-type"]', 'webhook');
    
    // Verify webhook fields are visible
    await expect(page.locator('[data-testid="input-printer-webhook-url"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-printer-webhook-secret"]')).toBeVisible();
    await expect(page.locator('[data-testid="switch-printer-webhook-enabled"]')).toBeVisible();
    
    // TCP fields should NOT be visible
    await expect(page.locator('[data-testid="input-printer-ip"]')).not.toBeVisible();
    
    // Fill webhook settings
    await page.fill('[data-testid="input-printer-webhook-url"]', 'https://printer.example.com/webhook');
    await page.fill('[data-testid="input-printer-webhook-secret"]', 'secret-key-123456');
    
    // Enable webhook
    await page.click('[data-testid="switch-printer-webhook-enabled"]');
    
    // Save
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });

  test('Webhook URL validation - invalid URL format', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Enable printer
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // Select Webhook type
    await page.selectOption('[data-testid="select-printer-type"]', 'webhook');
    
    // Fill with invalid URL
    await page.fill('[data-testid="input-printer-webhook-url"]', 'not-a-valid-url');
    
    // Try to save
    await page.click('[data-testid="button-save-settings"]');
    
    // Should show validation error or not save
    // Either error message visible or URL field has error state
    const hasError = await page.locator('[data-testid="input-printer-webhook-url"]').evaluate(
      (el: any) => el.validity?.valid === false
    );
    expect(hasError || await page.locator('text=URL inválida').isVisible()).toBeTruthy();
  });

  test('Toggle webhook enabled/disabled', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Enable printer
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // Select Webhook type
    await page.selectOption('[data-testid="select-printer-type"]', 'webhook');
    
    // Fill webhook URL
    await page.fill('[data-testid="input-printer-webhook-url"]', 'https://printer.example.com/webhook');
    await page.fill('[data-testid="input-printer-webhook-secret"]', 'secret-123');
    
    // Webhook should be disabled by default
    const webhookToggle = page.locator('[data-testid="switch-printer-webhook-enabled"]');
    let isChecked = await webhookToggle.evaluate((el: any) => el.checked);
    
    // Toggle it on
    await webhookToggle.click();
    isChecked = await webhookToggle.evaluate((el: any) => el.checked);
    expect(isChecked).toBe(true);
    
    // Save with webhook enabled
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });

  test('Switch between printer types (TCP -> Webhook -> USB)', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Enable printer
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // Start with TCP
    await page.selectOption('[data-testid="select-printer-type"]', 'tcp');
    await expect(page.locator('[data-testid="input-printer-ip"]')).toBeVisible();
    
    // Switch to Webhook
    await page.selectOption('[data-testid="select-printer-type"]', 'webhook');
    await expect(page.locator('[data-testid="input-printer-webhook-url"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-printer-ip"]')).not.toBeVisible();
    
    // Fill webhook data
    await page.fill('[data-testid="input-printer-webhook-url"]', 'https://printer.example.com/webhook');
    
    // Switch to USB
    await page.selectOption('[data-testid="select-printer-type"]', 'usb');
    await expect(page.locator('[data-testid="input-printer-webhook-url"]')).not.toBeVisible();
    
    // Save
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });

  test('Disable printer - all fields hidden', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Toggle printer on first
    await page.click('[data-testid="switch-printer-enabled"]');
    await expect(page.locator('[data-testid="select-printer-type"]')).toBeVisible();
    
    // Now toggle off
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // All printer configuration fields should be hidden
    await expect(page.locator('[data-testid="select-printer-type"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="input-printer-ip"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="input-printer-webhook-url"]')).not.toBeVisible();
    
    // Save
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });

  test('Printer settings persistence - reload and verify', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Configure TCP printer
    await page.click('[data-testid="switch-printer-enabled"]');
    await page.selectOption('[data-testid="select-printer-type"]', 'tcp');
    await page.fill('[data-testid="input-printer-ip"]', '192.168.1.50');
    await page.fill('[data-testid="input-printer-port"]', '8888');
    
    // Save
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Verify settings persisted
    const printerEnabled = page.locator('[data-testid="switch-printer-enabled"]');
    const isEnabled = await printerEnabled.evaluate((el: any) => el.checked);
    expect(isEnabled).toBe(true);
    
    const selectedType = await page.locator('[data-testid="select-printer-type"]').inputValue();
    expect(selectedType).toBe('tcp');
    
    const ip = await page.locator('[data-testid="input-printer-ip"]').inputValue();
    expect(ip).toBe('192.168.1.50');
  });

  test('Kitchen orders printing toggle', async ({ page }) => {
    await page.goto('/restaurant/settings');
    
    // Enable printer
    await page.click('[data-testid="switch-printer-enabled"]');
    
    // Toggle kitchen printing
    const kitchenToggle = page.locator('[data-testid="switch-print-kitchen"]');
    await kitchenToggle.click();
    
    let isChecked = await kitchenToggle.evaluate((el: any) => el.checked);
    expect(isChecked).toBe(true);
    
    // Toggle off
    await kitchenToggle.click();
    isChecked = await kitchenToggle.evaluate((el: any) => el.checked);
    expect(isChecked).toBe(false);
    
    // Save
    await page.click('[data-testid="button-save-settings"]');
    await expect(page.locator('text=Configurações salvas')).toBeVisible();
  });
});
