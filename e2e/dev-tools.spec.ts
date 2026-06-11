import { test, expect } from '@playwright/test';

test.describe('Dev Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('timestamp should load page', async ({ page }) => {
    await page.goto('/dev/timestamp');
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

  test('password-gen should load page', async ({ page }) => {
    await page.goto('/dev/password-gen');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('jwt-decode should load page', async ({ page }) => {
    await page.goto('/dev/jwt-decode');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('dns-lookup should load page', async ({ page }) => {
    await page.goto('/dev/dns-lookup');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('qrcode-gen should load page', async ({ page }) => {
    await page.goto('/dev/qrcode-gen');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
