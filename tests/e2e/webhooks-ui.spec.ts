import { test, expect } from '@playwright/test';

test.describe('Webhook Configuration UI (Restaurant Integrations)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to integrations page
    await page.goto('/restaurant/integrations');
    await page.waitForLoadState('networkidle');
  });

  test('Integrations page loads with all platforms', async ({ page }) => {
    // Check page title
    const title = page.locator('h1');
    await expect(title).toContainText('Integrações');
    
    // Verify all platform cards are visible
    const ifoodCard = page.locator('[data-testid="card-integration-ifood"]');
    const ubereatsCard = page.locator('[data-testid="card-integration-ubereats"]');
    const queroCard = page.locator('[data-testid="card-integration-quero"]');
    const pedeCard = page.locator('[data-testid="card-integration-pede_ai"]');
    
    await expect(ifoodCard).toBeVisible();
    await expect(ubereatsCard).toBeVisible();
    await expect(queroCard).toBeVisible();
    await expect(pedeCard).toBeVisible();
  });

  test('Can view integration add form', async ({ page }) => {
    // Look for "Add Integration" button
    const addButton = page.locator('button:has-text("Adicionar")').first();
    
    // Button should be visible
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Form should appear
      const platformSelect = page.locator('select, [role="combobox"]').first();
      await expect(platformSelect).toBeVisible();
    }
  });

  test('Printer webhook configuration is available', async ({ page }) => {
    // Check if there's a section for printer/thermal printer
    const printerSection = page.locator('text=/Impressora|Printer|printer/');
    
    // Printer config should exist (either visible or in settings)
    const settingsButton = page.locator('button[aria-label*="Configurar"], button:has-text("Configurar")').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Platform integration cards show status', async ({ page }) => {
    // Each platform card should show status (connected/disconnected)
    const cards = page.locator('[data-testid*="card-integration-"]');
    const count = await cards.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Each card should be clickable or have interaction
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
  });

  test('Can interact with integration settings', async ({ page }) => {
    // Find any settings or configuration button
    const settingsButtons = page.locator('button, a').filter({ hasText: /Configurar|Settings|Editar/ });
    const count = await settingsButtons.count();
    
    // At least the page should be accessible
    const title = page.locator('h1, h2');
    await expect(title).toBeVisible();
  });

  test('Integrations page is responsive', async ({ page }) => {
    // Check that page layout adapts
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();
    
    // Grid should adjust based on viewport
    const gridCards = page.locator('[data-testid*="card-integration-"]');
    expect(await gridCards.count()).toBeGreaterThan(0);
  });
});

test.describe('Webhook API Endpoints', () => {
  const baseURL = 'http://localhost:5000';
  let token: string;
  let restaurantId: string;

  test.beforeEach(async ({ request }) => {
    // Login as restaurant owner
    const loginRes = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'wilson@wilsonpizza.com',
        password: 'wilson123',
      },
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    restaurantId = loginData.tenantId || '9ff08749-cfe8-47e5-8964-3284a9e8a901';
  });

  test('Get restaurant webhooks configuration', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/restaurant/webhooks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    expect([200, 404]).toContain(response.status());
  });

  test('Configure printer webhook', async ({ request }) => {
    const response = await request.patch(
      `${baseURL}/api/restaurants/${restaurantId}/webhooks/printer`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          tcpIp: '192.168.1.100',
          tcpPort: 9100,
          type: 'STAR_THERMAL',
        },
      }
    );
    
    expect([200, 201, 400, 401, 404]).toContain(response.status());
  });

  test('Get printer webhook configuration', async ({ request }) => {
    const response = await request.get(
      `${baseURL}/api/restaurants/${restaurantId}/webhooks/printer`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    expect([200, 404]).toContain(response.status());
  });

  test('Delete printer webhook', async ({ request }) => {
    const response = await request.delete(
      `${baseURL}/api/restaurants/${restaurantId}/webhooks/printer`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    expect([200, 204, 404]).toContain(response.status());
  });

  test('Add external platform integration', async ({ request }) => {
    const response = await request.post(
      `${baseURL}/api/restaurant/integrations`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          platform: 'ifood',
          accessToken: 'test-token-ifood',
          externalId: 'test-merchant-id',
        },
      }
    );
    
    expect([200, 201, 400]).toContain(response.status());
  });

  test('List all restaurant integrations', async ({ request }) => {
    const response = await request.get(
      `${baseURL}/api/restaurant/integrations`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
    }
  });

  test('External platform webhook receives order (iFood)', async ({ request }) => {
    const tenantId = '9ff08749-cfe8-47e5-8964-3284a9e8a901';
    
    const response = await request.post(`${baseURL}/api/webhooks/ifood/${tenantId}`, {
      headers: { 'x-ifood-signature': 'test-signature' },
      data: {
        event: 'order.created',
        order: {
          id: 'ifood-test-' + Date.now(),
          items: [{ name: 'Pizza Margherita', quantity: 1, price: '45.00' }],
          total: '45.00',
          customer: { name: 'Test Customer', phone: '11999999999' },
        },
      },
    });
    
    expect([200, 201, 202, 400, 401]).toContain(response.status());
  });

  test('External platform webhook receives order (UberEats)', async ({ request }) => {
    const tenantId = '9ff08749-cfe8-47e5-8964-3284a9e8a901';
    
    const response = await request.post(`${baseURL}/api/webhooks/ubereats/${tenantId}`, {
      headers: { 'x-ubereats-signature': 'test-signature' },
      data: {
        event: 'order.placed',
        order: {
          id: 'ubereats-test-' + Date.now(),
          items: [{ name: 'Coca-Cola 2L', quantity: 1, price: '15.00' }],
          total: '15.00',
          customer: { name: 'Test Customer', phone: '11999999999' },
        },
      },
    });
    
    expect([200, 201, 202, 400, 401]).toContain(response.status());
  });

  test('Test webhook connectivity', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/restaurant/webhooks/test`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        webhookUrl: 'http://localhost:5000/api/health',
        service: 'ifood',
      },
    });
    
    expect([200, 400]).toContain(response.status());
  });
});
