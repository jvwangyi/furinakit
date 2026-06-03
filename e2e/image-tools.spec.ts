import { test, expect } from '@playwright/test';

test.describe('Image Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('image-compress should load page', async ({ page }) => {
    await page.goto('/furinakit/image/image-compress');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('image-convert should load page', async ({ page }) => {
    await page.goto('/furinakit/image/image-convert');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('image-crop should load page', async ({ page }) => {
    await page.goto('/furinakit/image/image-crop');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('image-resize should load page', async ({ page }) => {
    await page.goto('/furinakit/image/image-resize');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('image-add-watermark should load page', async ({ page }) => {
    await page.goto('/furinakit/image/image-add-watermark');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
