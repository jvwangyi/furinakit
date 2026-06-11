import { test, expect } from '@playwright/test';

test.describe('Convert Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('csv-to-json should load page', async ({ page }) => {
    await page.goto('/convert/csv-to-json');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('json-to-yaml should load page', async ({ page }) => {
    await page.goto('/convert/json-to-yaml');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('yaml-to-json should load page', async ({ page }) => {
    await page.goto('/convert/yaml-to-json');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('json-to-xml should load page', async ({ page }) => {
    await page.goto('/convert/json-to-xml');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('xml-to-json should load page', async ({ page }) => {
    await page.goto('/convert/xml-to-json');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('markdown-to-pdf should load page', async ({ page }) => {
    await page.goto('/convert/markdown-to-pdf');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('image-to-pdf should load page', async ({ page }) => {
    await page.goto('/convert/image-to-pdf');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('barcode-gen should load page', async ({ page }) => {
    await page.goto('/convert/barcode-gen');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
