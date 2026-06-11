import { test, expect } from '@playwright/test';

test.describe('File Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('file-info should load page', async ({ page }) => {
    await page.goto('/file/file-info');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('file-hash should load page', async ({ page }) => {
    await page.goto('/file/file-hash');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Craft Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('word-cloud should load page', async ({ page }) => {
    await page.goto('/craft/word-cloud');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('pomodoro should load page', async ({ page }) => {
    await page.goto('/craft/pomodoro');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('business-card should load page', async ({ page }) => {
    await page.goto('/craft/business-card');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
