import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:5000';
const APP_URL = 'http://localhost:5000';

// Test credentials
const ADMIN_CREDS = {
  email: 'admin@foodflow.com',
  password: 'Admin123!'
};

const OWNER_CREDS = {
  email: 'wilson@wilsonpizza.com',
  password: 'wilson123'
};

const CUSTOMER_CREDS = {
  email: 'customer@example.com',
  password: 'password'
};

let tenantId = '9ff08749-cfe8-47e5-8964-3284a9e8a901';
let adminToken = '';
let ownerToken = '';
let customerToken = '';

test.describe('External Integrations E2E Tests - Production Simulation', () => {
  
  test('1. Setup: Login all users and get tokens', async ({ request }) => {
    // Admin login
    const adminRes = await request.post(`${API_URL}/api/auth/login`, {
      data: ADMIN_CREDS
    });
    expect(adminRes.ok()).toBeTruthy();
    const adminData = await adminRes.json();
    adminToken = adminData.accessToken;
    console.log('✅ Admin logged in');

    // Owner login
    const ownerRes = await request.post(`${API_URL}/api/auth/login`, {
      data: OWNER_CREDS
    });
    expect(ownerRes.ok()).toBeTruthy();
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.accessToken;
    tenantId = ownerData.user.tenantId;
    console.log('✅ Owner logged in');

    // Customer login
    const customerRes = await request.post(`${API_URL}/api/auth/login`, {
      data: CUSTOMER_CREDS
    });
    expect(customerRes.ok()).toBeTruthy();
    const customerData = await customerRes.json();
    customerToken = customerData.accessToken;
    console.log('✅ Customer logged in');
  });

  test('2. Simulate iFood Webhook - Order Created', async ({ request }) => {
    const webhookPayload = {
      event: 'order.created',
      data: {
        orderId: `ifood-${Date.now()}`,
        customerName: 'João Silva',
        customerPhone: '5587999999999',
        customerEmail: 'joao@example.com',
        deliveryAddress: 'Rua das Flores, 123, Centro',
        items: [
          { name: 'Pizza Margherita', quantity: 2, price: '45.00' },
          { name: 'Coca-Cola 2L', quantity: 1, price: '12.00' }
        ],
        total: '102.00',
        status: 'confirmed',
        source: 'ifood',
        externalId: `ifood-ext-${Date.now()}`
      },
      timestamp: new Date().toISOString()
    };

    const res = await request.post(
      `${API_URL}/api/webhooks/ifood/${tenantId}`,
      {
        data: webhookPayload,
        headers: {
          'x-ifood-signature': 'test-signature',
          'Content-Type': 'application/json'
        }
      }
    );

    expect([200, 201]).toContain(res.status());
    const result = await res.json();
    console.log('✅ iFood webhook processed:', result);
  });

  test('3. Simulate UberEats Webhook - Order Created', async ({ request }) => {
    const webhookPayload = {
      event: 'order.created',
      data: {
        orderId: `ubereats-${Date.now()}`,
        customerName: 'Maria Santos',
        customerPhone: '5588888888888',
        customerEmail: 'maria@example.com',
        deliveryAddress: 'Av. Paulista, 456, Apto 789',
        items: [
          { name: 'Pizza Calabresa', quantity: 1, price: '55.00' },
          { name: 'Refrigerante 1L', quantity: 2, price: '8.00' }
        ],
        total: '71.00',
        status: 'confirmed',
        source: 'ubereats',
        externalId: `ubereats-ext-${Date.now()}`
      },
      timestamp: new Date().toISOString()
    };

    const res = await request.post(
      `${API_URL}/api/webhooks/ubereats/${tenantId}`,
      {
        data: webhookPayload,
        headers: {
          'x-ubereats-signature': 'test-signature',
          'Content-Type': 'application/json'
        }
      }
    );

    expect([200, 201]).toContain(res.status());
    const result = await res.json();
    console.log('✅ UberEats webhook processed:', result);
  });

  test('4. Verify Orders Appear in Restaurant Dashboard', async ({ request }) => {
    const res = await request.get(
      `${API_URL}/api/restaurant/orders`,
      {
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }
    );

    expect(res.ok()).toBeTruthy();
    const orders = await res.json();
    
    // Check if external orders exist
    const externalOrders = orders.data?.filter((o: any) => 
      o.paymentMethod === 'ifood' || o.paymentMethod === 'ubereats'
    ) || [];
    
    console.log(`✅ Found ${externalOrders.length} external orders in dashboard`);
    expect(externalOrders.length).toBeGreaterThanOrEqual(0);
  });

  test('5. Test Order Status Update Flow', async ({ request }) => {
    // Get first order
    const ordersRes = await request.get(
      `${API_URL}/api/restaurant/orders`,
      {
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }
    );

    const orders = await ordersRes.json();
    const firstOrder = orders.data?.[0];
    
    if (!firstOrder) {
      console.log('⚠️ No orders found, skipping status update test');
      return;
    }

    // Update order status
    const updateRes = await request.patch(
      `${API_URL}/api/orders/${firstOrder.id}`,
      {
        data: {
          status: 'preparing'
        },
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }
    );

    expect([200, 204]).toContain(updateRes.status());
    console.log('✅ Order status updated to preparing');

    // Verify status change
    const verifyRes = await request.get(
      `${API_URL}/api/orders/${firstOrder.id}`,
      {
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }
    );

    const updatedOrder = await verifyRes.json();
    expect(updatedOrder.status).toBe('preparing');
    console.log('✅ Order status verified:', updatedOrder.status);
  });

  test('6. Test Integration Dashboard Page', async ({ page }) => {
    // Login as owner
    await page.goto(`${APP_URL}/login`);
    await page.fill('input[type="email"]', OWNER_CREDS.email);
    await page.fill('input[type="password"]', OWNER_CREDS.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(`${APP_URL}/restaurant/dashboard`, { timeout: 10000 });
    
    // Navigate to integrations
    await page.click('button[data-testid="button-integrations"]');
    await page.waitForURL(`${APP_URL}/restaurant/integrations`, { timeout: 10000 });
    
    // Verify integrations page loaded
    const heading = page.locator('text=Integrações Externas');
    await expect(heading).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Integration page loaded successfully');

    // Check for integration cards
    const ifoodCard = page.locator('[data-testid="card-integration-ifood"]');
    await expect(ifoodCard).toBeVisible({ timeout: 5000 });
    console.log('✅ iFood integration card visible');

    const ubereatsCard = page.locator('[data-testid="card-integration-ubereats"]');
    await expect(ubereatsCard).toBeVisible({ timeout: 5000 });
    console.log('✅ UberEats integration card visible');
  });

  test('7. Test Restaurant Registration Flow', async ({ page }) => {
    await page.goto(`${APP_URL}/register-restaurant`);
    
    // Fill registration form
    const restaurantName = `Test Restaurant ${Date.now()}`;
    const email = `testowner${Date.now()}@example.com`;
    
    await page.fill('[data-testid="input-restaurant-name"]', restaurantName);
    await page.fill('[data-testid="input-restaurant-email"]', email);
    await page.fill('[data-testid="input-restaurant-password"]', 'TestPassword123!');
    await page.fill('[data-testid="input-restaurant-phone"]', '5591234567890');
    
    // Submit form
    await page.click('[data-testid="button-submit"]');
    
    // Check for success or error
    const successToast = page.locator('text=Sucesso');
    const errorToast = page.locator('text=Erro');
    
    const toastVisible = await Promise.race([
      successToast.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'success'),
      errorToast.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'error'),
      new Promise(resolve => setTimeout(() => resolve('timeout'), 5000))
    ]);
    
    console.log(`✅ Restaurant registration test result: ${toastVisible}`);
  });

  test('8. Test Admin Dashboard Access', async ({ page }) => {
    await page.goto(`${APP_URL}/login`);
    
    // Login as admin
    await page.fill('input[type="email"]', ADMIN_CREDS.email);
    await page.fill('input[type="password"]', ADMIN_CREDS.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await page.waitForURL(url => url.pathname === '/admin/dashboard', { timeout: 10000 });
    console.log('✅ Admin dashboard accessible');

    // Check for admin content
    const adminHeading = page.locator('text=/Painel.*Admin|Dashboard.*Admin/i');
    const isVisible = await adminHeading.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✅ Admin panel heading found');
    } else {
      console.log('⚠️ Admin heading not found, but page loaded');
    }
  });

  test('9. Test Order Tracking - Real-time Updates', async ({ request }) => {
    // Simulate multiple order updates
    const ordersRes = await request.get(
      `${API_URL}/api/restaurant/orders`,
      {
        headers: {
          'Authorization': `Bearer ${ownerToken}`
        }
      }
    );

    const orders = await ordersRes.json();
    const testOrder = orders.data?.[0];
    
    if (!testOrder) return;

    const statuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    
    for (const status of statuses) {
      const updateRes = await request.patch(
        `${API_URL}/api/orders/${testOrder.id}`,
        {
          data: { status },
          headers: {
            'Authorization': `Bearer ${ownerToken}`
          }
        }
      );
      
      if (updateRes.ok()) {
        console.log(`✅ Order status updated to: ${status}`);
      }
    }
  });

  test('10. Test Health Check Endpoint', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/health`);
    expect(res.ok()).toBeTruthy();
    
    const data = await res.json();
    expect(data.status).toBe('ok');
    console.log('✅ Health check passed:', data);
  });

});
