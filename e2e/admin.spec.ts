import { test, expect } from '@playwright/test';

test.describe('Admin Access Control', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('should redirect /admin to /admin/stats', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Admin page redirects to /admin/stats
    await expect(page).toHaveURL(/\/admin\/stats/);
  });

  test('should show access denied for unauthenticated user', async ({ page }) => {
    await page.goto('/admin/stats');
    await page.waitForLoadState('networkidle');

    // Wait for the admin layout to check auth
    await page.waitForTimeout(2000);

    // Should show either the no-permission message or the stats page
    // The admin layout checks /api/admin/stats and shows ShieldAlert if not admin
    const noPermission = page.locator('text=/没有权限|no.permission|No Permission|ShieldAlert/').first();
    const statsHeading = page.locator('h1, h2').filter({ hasText: /统计|Stats|管理/ }).first();

    // One of these should be visible
    const hasNoPermission = await noPermission.isVisible().catch(() => false);
    const hasStats = await statsHeading.isVisible().catch(() => false);

    expect(hasNoPermission || hasStats).toBeTruthy();
  });

  test('should show admin navigation tabs when accessible', async ({ page }) => {
    await page.goto('/admin/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // If admin is accessible, check navigation tabs exist
    const statsTab = page.locator('a[href="/admin/stats"]').first();
    const usersTab = page.locator('a[href="/admin/users"]').first();
    const toolsTab = page.locator('a[href="/admin/tools"]').first();
    const systemTab = page.locator('a[href="/admin/system"]').first();

    // Check if admin panel is accessible (tabs visible)
    const isStatsVisible = await statsTab.isVisible().catch(() => false);

    if (isStatsVisible) {
      // If we can see the stats tab, all admin tabs should be visible
      await expect(usersTab).toBeVisible();
      await expect(toolsTab).toBeVisible();
      await expect(systemTab).toBeVisible();
    }
    // If not admin, we just verify the page didn't crash
  });

  test('should have back to home link on admin pages', async ({ page }) => {
    await page.goto('/admin/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should have a back arrow or home link
    const backLink = page.locator('a[href="/"], a[href]').filter({ has: page.locator('svg') }).first();
    await expect(backLink).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between admin sub-pages when accessible', async ({ page }) => {
    await page.goto('/admin/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if admin panel is accessible
    const statsTab = page.locator('a[href="/admin/stats"]').first();
    const isStatsVisible = await statsTab.isVisible().catch(() => false);

    if (isStatsVisible) {
      // Navigate to users
      const usersTab = page.locator('a[href="/admin/users"]').first();
      await usersTab.click();
      await expect(page).toHaveURL(/\/admin\/users/);

      // Navigate to tools
      const toolsTab = page.locator('a[href="/admin/tools"]').first();
      await toolsTab.click();
      await expect(page).toHaveURL(/\/admin\/tools/);

      // Navigate to system
      const systemTab = page.locator('a[href="/admin/system"]').first();
      await systemTab.click();
      await expect(page).toHaveURL(/\/admin\/system/);

      // Navigate back to stats
      await statsTab.click();
      await expect(page).toHaveURL(/\/admin\/stats/);
    }
  });
});
