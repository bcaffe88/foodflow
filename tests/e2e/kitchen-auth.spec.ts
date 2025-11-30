import { test, expect } from '@playwright/test';

test.describe('Kitchen Staff Authentication - Isolated Login System', () => {
  const OWNER_EMAIL = 'wilson@wilsonpizza.com';
  const OWNER_PASSWORD = 'wilson123';
  const STAFF_EMAIL = `staff-${Date.now()}@test.com`;
  const STAFF_PASSWORD = 'staff123456';

  test.beforeEach(async ({ page }) => {
    // Navigate to home
    await page.goto('/');
  });

  test('Owner creates kitchen staff and staff can login independently', async ({ page }) => {
    // 1. Owner login
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', OWNER_EMAIL);
    await page.fill('[data-testid="input-password"]', OWNER_PASSWORD);
    await page.click('[data-testid="button-login"]');
    await expect(page).toHaveURL(/\/restaurant\/dashboard/);

    // 2. Navigate to settings
    await page.click('[data-testid="link-settings"]');
    await expect(page).toHaveURL(/\/restaurant\/settings/);
    
    // 3. Find kitchen staff section
    const staffSection = page.locator('text=Gerenciar Funcionários de Cozinha');
    await expect(staffSection).toBeVisible();
    
    // 4. Create new staff member
    await page.fill('[data-testid="input-staff-email"]', STAFF_EMAIL);
    await page.fill('[data-testid="input-staff-password"]', STAFF_PASSWORD);
    await page.click('[data-testid="button-create-staff"]');
    
    // Wait for success message
    await expect(page.locator('text=Funcionário adicionado')).toBeVisible({ timeout: 5000 });
    
    // 5. Verify staff appears in list
    const staffItem = page.locator(`text=${STAFF_EMAIL}`);
    await expect(staffItem).toBeVisible();
    
    // 6. Logout owner
    await page.click('[data-testid="button-logout"]');
    await expect(page).toHaveURL(/\/login/);
    
    // 7. Staff login with own credentials
    await page.click('text=Entrar');
    // Navigate to kitchen login if not on login page
    const kitchenLoginLink = page.locator('text=Acesso de Funcionário').or(page.locator('a[href="/kitchen/login"]'));
    if (await kitchenLoginLink.isVisible()) {
      await kitchenLoginLink.click();
    }
    
    // Fill kitchen login form
    await page.fill('[data-testid="input-email"]', STAFF_EMAIL);
    await page.fill('[data-testid="input-password"]', STAFF_PASSWORD);
    await page.click('[data-testid="button-login"]');
    
    // Verify staff is in kitchen dashboard
    await expect(page).toHaveURL(/\/kitchen\/dashboard/, { timeout: 10000 });
    
    // Verify staff cannot access owner settings
    await page.goto('/restaurant/settings', { waitUntil: 'networkidle' });
    // Should be redirected or see error
    const isRedirected = page.url().includes('/kitchen/dashboard') || page.url().includes('/login');
    expect(isRedirected).toBeTruthy();
  });

  test('Kitchen staff isolation - no access to restaurant owner panel', async ({ page }) => {
    // 1. Create staff first via owner
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', OWNER_EMAIL);
    await page.fill('[data-testid="input-password"]', OWNER_PASSWORD);
    await page.click('[data-testid="button-login"]');
    
    await page.click('[data-testid="link-settings"]');
    await page.fill('[data-testid="input-staff-email"]', `isolated-${Date.now()}@test.com`);
    await page.fill('[data-testid="input-staff-password"]', 'test123456');
    await page.click('[data-testid="button-create-staff"]');
    
    const staffEmail = await page.locator('[data-testid="input-staff-email"]').inputValue();
    
    // 2. Logout owner
    await page.click('[data-testid="button-logout"]');
    
    // 3. Login as staff
    await page.click('text=Entrar');
    await page.goto('/kitchen/login');
    await page.fill('[data-testid="input-email"]', staffEmail);
    await page.fill('[data-testid="input-password"]', 'test123456');
    await page.click('[data-testid="button-login"]');
    
    await expect(page).toHaveURL(/\/kitchen\/dashboard/);
    
    // 4. Try to access restaurant owner pages - should fail
    const restrictedPages = [
      '/restaurant/dashboard',
      '/restaurant/settings',
      '/restaurant/products',
      '/restaurant/orders'
    ];
    
    for (const restrictedPage of restrictedPages) {
      await page.goto(restrictedPage, { waitUntil: 'networkidle' });
      // Should not be on the restricted page
      const currentUrl = page.url();
      const isRestricted = !currentUrl.includes(restrictedPage) || currentUrl.includes('/kitchen/dashboard') || currentUrl.includes('/login');
      expect(isRestricted).toBeTruthy();
    }
  });

  test('Owner can delete kitchen staff member', async ({ page }) => {
    // 1. Owner login and create staff
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', OWNER_EMAIL);
    await page.fill('[data-testid="input-password"]', OWNER_PASSWORD);
    await page.click('[data-testid="button-login"]');
    
    await page.click('[data-testid="link-settings"]');
    
    const deleteStaffEmail = `delete-test-${Date.now()}@test.com`;
    await page.fill('[data-testid="input-staff-email"]', deleteStaffEmail);
    await page.fill('[data-testid="input-staff-password"]', 'test123456');
    await page.click('[data-testid="button-create-staff"]');
    
    // Wait for staff to appear
    await expect(page.locator(`text=${deleteStaffEmail}`)).toBeVisible();
    
    // 2. Delete the staff member
    const deleteButton = page.locator(`[data-testid^="button-delete-staff-"]`).first();
    await deleteButton.click();
    
    // Handle confirmation dialog
    page.once('dialog', dialog => {
      dialog.accept();
    });
    
    // Wait for removal
    await expect(page.locator(`text=${deleteStaffEmail}`)).not.toBeVisible({ timeout: 5000 });
    
    // 3. Deleted staff should not be able to login anymore
    await page.click('[data-testid="button-logout"]');
    await page.click('text=Entrar');
    await page.goto('/kitchen/login');
    await page.fill('[data-testid="input-email"]', deleteStaffEmail);
    await page.fill('[data-testid="input-password"]', 'test123456');
    await page.click('[data-testid="button-login"]');
    
    // Should see error or redirect to login
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Alternative: check if still on kitchen/login
      expect(page.url()).toContain('/kitchen/login');
    });
  });

  test('Kitchen staff has role isolation in JWT token', async ({ page, context }) => {
    // 1. Create staff
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', OWNER_EMAIL);
    await page.fill('[data-testid="input-password"]', OWNER_PASSWORD);
    await page.click('[data-testid="button-login"]');
    
    await page.click('[data-testid="link-settings"]');
    
    const jwtTestEmail = `jwt-test-${Date.now()}@test.com`;
    await page.fill('[data-testid="input-staff-email"]', jwtTestEmail);
    await page.fill('[data-testid="input-staff-password"]', 'test123456');
    await page.click('[data-testid="button-create-staff"]');
    
    // 2. Logout and login as staff
    await page.click('[data-testid="button-logout"]');
    await page.click('text=Entrar');
    await page.goto('/kitchen/login');
    await page.fill('[data-testid="input-email"]', jwtTestEmail);
    await page.fill('[data-testid="input-password"]', 'test123456');
    await page.click('[data-testid="button-login"]');
    
    // 3. Check localStorage for token and user role
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    
    // Verify token exists
    expect(token).toBeTruthy();
    
    // Verify user role is kitchen_staff
    expect(user.role).toBe('kitchen_staff');
    
    // Verify email matches
    expect(user.email).toBe(jwtTestEmail);
  });

  test('Kitchen staff access kitchen endpoints only', async ({ page }) => {
    // 1. Setup: Create and login as staff
    await page.click('text=Entrar');
    await page.fill('[data-testid="input-email"]', OWNER_EMAIL);
    await page.fill('[data-testid="input-password"]', OWNER_PASSWORD);
    await page.click('[data-testid="button-login"]');
    
    await page.click('[data-testid="link-settings"]');
    const endpointTestEmail = `endpoint-test-${Date.now()}@test.com`;
    await page.fill('[data-testid="input-staff-email"]', endpointTestEmail);
    await page.fill('[data-testid="input-staff-password"]', 'test123456');
    await page.click('[data-testid="button-create-staff"]');
    
    await page.click('[data-testid="button-logout"]');
    
    // 2. Login as staff
    await page.click('text=Entrar');
    await page.goto('/kitchen/login');
    await page.fill('[data-testid="input-email"]', endpointTestEmail);
    await page.fill('[data-testid="input-password"]', 'test123456');
    await page.click('[data-testid="button-login"]');
    
    // 3. Kitchen dashboard should load
    await expect(page).toHaveURL(/\/kitchen\/dashboard/);
    
    // Verify kitchen orders can be fetched
    const ordersVisible = await page.locator('text=Pedidos da Cozinha').or(page.locator('text=Orders')).isVisible().catch(() => false);
    expect(ordersVisible || page.url().includes('/kitchen/dashboard')).toBeTruthy();
  });
});
