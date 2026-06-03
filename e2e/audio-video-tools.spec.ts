import { test, expect } from '@playwright/test';

test.describe('Audio Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('audio-convert should load page', async ({ page }) => {
    await page.goto('/audio/audio-convert');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('audio-trim should load page', async ({ page }) => {
    await page.goto('/audio/audio-trim');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Video Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('video-compress should load page', async ({ page }) => {
    await page.goto('/video/video-compress');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('video-to-audio should load page', async ({ page }) => {
    await page.goto('/video/video-to-audio');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('video-trim should load page', async ({ page }) => {
    await page.goto('/video/video-trim');
    await page.waitForLoadState('networkidle');

    // Check page loaded - look for tool title in the page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});
