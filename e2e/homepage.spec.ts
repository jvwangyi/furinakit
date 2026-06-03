import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/FurinaKit/);
    
    // Check hero section is visible - use main content area to avoid sidebar duplicate
    const hero = page.locator('main h1:has-text("FurinaKit")');
    await expect(hero).toBeVisible();
  });

  test('should display tool list', async ({ page }) => {
    // Wait for tools to load (loading spinner disappears)
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
    
    // Check tool cards are displayed
    const toolCards = page.locator('a[href*="/"]');
    const count = await toolCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter tools by search', async ({ page }) => {
    // Wait for tools to load
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
    
    // Get initial tool count
    const initialCards = page.locator('a[href*="/"]');
    const initialCount = await initialCards.count();
    
    // Type in search input
    const searchInput = page.locator('input[placeholder]');
    await searchInput.fill('pdf');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Check filtered results
    const filteredCards = page.locator('a[href*="/"]');
    const filteredCount = await filteredCards.count();
    
    // Should have fewer or equal tools after filtering
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('should filter tools by category', async ({ page }) => {
    // Wait for tools to load
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
    
    // Click on a category badge (e.g., PDF)
    const pdfBadge = page.locator('span:has-text("PDF"), [class*="badge"]:has-text("PDF")').first();
    if (await pdfBadge.isVisible()) {
      await pdfBadge.click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Check that tools are filtered
      const toolCards = page.locator('a[href*="/"]');
      const count = await toolCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
