import { test, expect } from '@playwright/test';

test.describe('PDF Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('pdf-rotate should load page', async ({ page }) => {
    await page.goto('/furinakit/pdf/pdf-rotate');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('pdf-compress should load page', async ({ page }) => {
    await page.goto('/furinakit/pdf/pdf-compress');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('pdf-split should load page', async ({ page }) => {
    await page.goto('/furinakit/pdf/pdf-split');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('pdf-merge should load page', async ({ page }) => {
    await page.goto('/furinakit/pdf/pdf-merge');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
