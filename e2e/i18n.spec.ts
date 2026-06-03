import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    // Clear locale preference to start fresh
    await page.goto('/furinakit/');
    await page.evaluate(() => localStorage.removeItem('furinakit-locale'));
    await page.reload();
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
  });

  test('should switch to English and verify UI text changes', async ({ page }) => {
    const sidebar = page.locator('aside').first();

    // Verify default language is Chinese
    await expect(sidebar.locator('text=全部')).toBeVisible();

    // Open language switcher
    const langSwitcher = sidebar.locator('button').filter({ hasText: /中文|English|日本語|한국어/ }).first();
    await langSwitcher.click();
    await page.waitForTimeout(300);

    // Click English option
    const englishOption = page.locator('button').filter({ hasText: 'English' }).first();
    await englishOption.click();
    await page.waitForTimeout(500);

    // Verify English text appears in sidebar
    await expect(sidebar.locator('text=All')).toBeVisible();
    await expect(sidebar.locator('text=FurinaKit Toolbox')).toBeVisible();
  });

  test('should switch to Japanese and verify UI text changes', async ({ page }) => {
    const sidebar = page.locator('aside').first();

    // Open language switcher
    const langSwitcher = sidebar.locator('button').filter({ hasText: /中文|English|日本語|한국어/ }).first();
    await langSwitcher.click();
    await page.waitForTimeout(300);

    // Click Japanese option
    const japaneseOption = page.locator('button').filter({ hasText: '日本語' }).first();
    await japaneseOption.click();
    await page.waitForTimeout(500);

    // Verify Japanese text appears in sidebar
    await expect(sidebar.locator('text=すべて')).toBeVisible();
  });

  test('should switch back to Chinese and verify restoration', async ({ page }) => {
    const sidebar = page.locator('aside').first();

    // First switch to English
    const langSwitcher = sidebar.locator('button').filter({ hasText: /中文|English|日本語|한국어/ }).first();
    await langSwitcher.click();
    await page.waitForTimeout(300);
    const englishOption = page.locator('button').filter({ hasText: 'English' }).first();
    await englishOption.click();
    await page.waitForTimeout(500);

    // Verify English is active
    await expect(sidebar.locator('text=All')).toBeVisible();

    // Now switch back to Chinese
    const langSwitcher2 = sidebar.locator('button').filter({ hasText: /中文|English|日本語|한국어/ }).first();
    await langSwitcher2.click();
    await page.waitForTimeout(300);
    const chineseOption = page.locator('button').filter({ hasText: '中文' }).first();
    await chineseOption.click();
    await page.waitForTimeout(500);

    // Verify Chinese is restored
    await expect(sidebar.locator('text=全部')).toBeVisible();
    await expect(sidebar.locator('text=芙宁娜的工具箱')).toBeVisible();
  });
});
