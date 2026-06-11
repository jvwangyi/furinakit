import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('should display sign-in page', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Should show login/register card
    const card = page.locator('text=/登录|Login|鐧诲綍/').first();
    await expect(card).toBeVisible({ timeout: 10000 });
  });

  test('should show login form with email and password fields', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Should have email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    // Should have password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Should have submit button
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
  });

  test('should switch between login and register tabs', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Find the tab switcher buttons
    const tabButtons = page.locator('button').filter({ hasText: /登录|鐧诲綍|注册|娉ㄥ唽/ });

    // Click register tab
    const registerTab = tabButtons.filter({ hasText: /注册|娉ㄥ唽/ }).first();
    await registerTab.click();
    await page.waitForTimeout(300);

    // Should now show register form - name field should be visible
    const nameInput = page.locator('input[placeholder*="称"], input[placeholder*="Name"]').first();
    await expect(nameInput).toBeVisible();

    // Click back to login
    const loginTab = tabButtons.filter({ hasText: /登录|鐧诲綍/ }).first();
    await loginTab.click();
    await page.waitForTimeout(300);

    // Should show login form again
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });

  test('should show error on invalid login attempt', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Fill in invalid credentials
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('nonexistent@example.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('wrongpassword123');

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Should show error message (text-destructive class or error text)
    const errorMsg = page.locator('.text-destructive, [class*="destructive"]').first();
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });

  test('should navigate back to home from sign-in page', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Find "返回首页" / "Back to home" link
    const backLink = page.locator('a').filter({ hasText: /返回首页|Back|杩斿洖棣栭〉/ }).first();
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Should navigate back to home
    await expect(page).toHaveURL(/\/$|\/index/);
  });

  test('should show forgot password flow', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Click "forgot password" link
    const forgotLink = page.locator('button, a').filter({ hasText: /忘记密码|Forgot|蹇樿/ }).first();
    await forgotLink.click();
    await page.waitForTimeout(300);

    // Should show email input for password reset
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });
});
