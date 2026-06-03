import { test, expect } from '@playwright/test';

test.describe('Dev Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('base64 should load page', async ({ page }) => {
    await page.goto('/dev/base64');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('url-encode should load page', async ({ page }) => {
    await page.goto('/dev/url-encode');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('timestamp should load page', async ({ page }) => {
    await page.goto('/dev/timestamp');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('regex-tester should load page', async ({ page }) => {
    await page.goto('/dev/regex-tester');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('color-convert should load page', async ({ page }) => {
    await page.goto('/dev/color-convert');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
