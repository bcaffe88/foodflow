// Testes E2E para fluxo de checkout completo
// Para executar: npm install -D @playwright/test && npx playwright test
// Nota: Arquivo placeholder - requer configuração do Playwright

// @ts-nocheck
// Testes E2E com Playwright - requer: npm install -D @playwright/test
const { test, expect } = require('@playwright/test');

test.describe('Fluxo de Checkout Completo', () => {
  test.beforeEach(async ({ page }: any) => {
    await page.goto('http://localhost:5000');
    await page.waitForLoadState('networkidle');
  });

  test('Deve listar restaurantes na home', async ({ page }: any) => {
    const restaurantes = await page.locator('[data-testid^="card-restaurant-"]');
    expect(await restaurantes.count()).toBeGreaterThan(0);
  });

  test('Deve abrir cardápio do restaurante', async ({ page }: any) => {
    await page.click('[data-testid^="card-restaurant-"]');
    await page.waitForLoadState('networkidle');
    const produtos = await page.locator('[data-testid^="card-product-"]');
    expect(await produtos.count()).toBeGreaterThan(0);
  });

  test('Deve adicionar produto ao carrinho', async ({ page }: any) => {
    await page.click('[data-testid^="card-restaurant-"]');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid^="button-add-cart-"]');
    
    const cartBadge = await page.locator('[data-testid="badge-cart-count"]');
    await expect(cartBadge).toContainText('1');
  });

  test('Deve abrir checkout e preencher dados de entrega', async ({ page }: any) => {
    // Adicionar produto
    await page.click('[data-testid^="card-restaurant-"]');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid^="button-add-cart-"]');
    
    // Abrir checkout
    await page.click('[data-testid="button-checkout"]');
    await page.waitForLoadState('networkidle');
    
    // Preencher dados de cliente
    await page.fill('[data-testid="input-customer-name"]', 'João Silva');
    await page.fill('[data-testid="input-customer-phone"]', '11999999999');
    await page.fill('[data-testid="input-customer-email"]', 'joao@test.com');
    
    // Selecionar endereço (Mock)
    await page.fill('[data-testid="input-address"]', 'Rua Teste, 123');
    
    // Selecionar método de pagamento
    await page.click('[data-testid="select-payment-method"]');
    await page.click('[data-testid="option-pix"]');
    
    // Confirmar
    await page.click('[data-testid="button-confirm-order"]');
    await page.waitForLoadState('networkidle');
    
    // Verificar confirmação
    await expect(page).toHaveURL(/.*order-confirmation.*/);
  });

  test('Deve processar pagamento com Stripe', async ({ page }: any) => {
    // Setup
    await page.click('[data-testid^="card-restaurant-"]');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid^="button-add-cart-"]');
    await page.click('[data-testid="button-checkout"]');
    await page.waitForLoadState('networkidle');
    
    // Preencher dados básicos
    await page.fill('[data-testid="input-customer-name"]', 'Maria Silva');
    await page.fill('[data-testid="input-customer-phone"]', '11988888888');
    await page.fill('[data-testid="input-customer-email"]', 'maria@test.com');
    await page.fill('[data-testid="input-address"]', 'Av. Principal, 456');
    
    // Selecionar cartão como pagamento
    await page.click('[data-testid="select-payment-method"]');
    await page.click('[data-testid="option-card"]');
    
    // Stripe Elements frame
    const stripeFrame = page.frameLocator('[title="Secure payment input frame"]');
    
    // Preencher dados do cartão (teste válido)
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12 / 25');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    
    // Confirmar pagamento
    await page.click('[data-testid="button-pay"]');
    
    // Aguardar confirmação (pode redirecionar para Stripe)
    await page.waitForTimeout(2000);
    
    // Verificar se completou ou redirecionou
    const url = page.url();
    expect(url).toMatch(/order-confirmation|stripe\.com/);
  });

  test('Deve validar carrinho vazio', async ({ page }: any) => {
    await page.click('[data-testid="button-checkout"]');
    
    const erro = await page.locator('[data-testid="text-error-empty-cart"]');
    await expect(erro).toContainText(/carrinho vazio|cart empty/i);
  });
});

test.describe('Testes de API Críticos', () => {
  test('GET /api/storefront/restaurants deve retornar lista', async ({ request }: any) => {
    const response = await request.get('http://localhost:5000/api/storefront/restaurants');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('GET /api/storefront/:slug/products deve retornar cardápio', async ({ request }: any) => {
    const response = await request.get('http://localhost:5000/api/storefront/wilsonpizza/products');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('POST /api/payments/create-intent deve retornar clientSecret', async ({ request }: any) => {
    const response = await request.post('http://localhost:5000/api/payments/create-intent', {
      data: { amount: 50.00 }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('clientSecret');
    expect(data).toHaveProperty('paymentIntentId');
  });

  test('POST /api/auth/login deve autenticar admin', async ({ request }: any) => {
    const response = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'admin@foodflow.com',
        password: 'Admin123!'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
  });
});
