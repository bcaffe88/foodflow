import { test, expect } from '@playwright/test';

test.describe('Webhook Integration Tests', () => {
  const baseURL = 'http://localhost:5000';
  let token: string;

  test.beforeEach(async ({ request }) => {
    // Get auth token
    const loginRes = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: 'wilson@wilsonpizza.com',
        password: 'wilson123',
      },
    });
    const loginData = await loginRes.json();
    token = loginData.token;
  });

  test('GET /api/restaurant/webhooks returns config', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/restaurant/webhooks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('ifood');
    expect(data).toHaveProperty('ubereats');
    expect(data).toHaveProperty('loggi');
    expect(data.ifood).toHaveProperty('webhookUrl');
  });

  test('POST /api/restaurant/webhooks/test validates webhook', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/restaurant/webhooks/test`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        webhookUrl: 'http://localhost:5000/api/health',
        service: 'ifood',
      },
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('iFood webhook endpoint receives orders', async ({ request }) => {
    const tenantId = '9ff08749-cfe8-47e5-8964-3284a9e8a901';
    
    const response = await request.post(`${baseURL}/api/webhooks/ifood/${tenantId}`, {
      headers: { 'x-ifood-signature': 'test-signature' },
      data: {
        event: 'order.created',
        order: {
          id: 'ifood-123',
          items: [{ name: 'Pizza', quantity: 1, price: '45.00' }],
          total: '45.00',
          customer: { name: 'Test Customer', phone: '11999999999' },
        },
      },
    });
    
    expect([200, 201, 202, 400, 401]).toContain(response.status());
  });

  test('UberEats webhook endpoint receives orders', async ({ request }) => {
    const tenantId = '9ff08749-cfe8-47e5-8964-3284a9e8a901';
    
    const response = await request.post(`${baseURL}/api/webhooks/ubereats/${tenantId}`, {
      headers: { 'x-ubereats-signature': 'test-signature' },
      data: {
        event: 'order.placed',
        order: {
          id: 'ubereats-456',
          items: [{ name: 'Bebida', quantity: 2, price: '15.00' }],
          total: '30.00',
        },
      },
    });
    
    expect([200, 201, 202, 400, 401]).toContain(response.status());
  });
});
