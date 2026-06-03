import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('should filter tools by search keyword on homepage', async ({ page }) => {
    await page.goto('/furinakit/');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });

    // Get initial tool count from the main grid (not sidebar)
    const mainContent = page.locator('main, .min-h-screen').first();
    const toolCards = mainContent.locator('a[href*="/furinakit/"]');
    const initialCount = await toolCards.count();

    // Type a keyword that should match some tools
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('json');
    await page.waitForTimeout(500);

    // Verify filtered results
    const filteredCount = await toolCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('should show empty state for non-existent search on homepage', async ({ page }) => {
    await page.goto('/furinakit/');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });

    // Search for something that doesn't exist
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('zzzznonexistenttool12345');
    await page.waitForTimeout(500);

    // Verify no tool cards in the main grid
    const mainContent = page.locator('main, .min-h-screen').first();
    const toolCards = mainContent.locator('.grid a[href*="/furinakit/"]');
    const count = await toolCards.count();
    expect(count).toBe(0);
  });

  test('should restore all tools after clearing search on homepage', async ({ page }) => {
    await page.goto('/furinakit/');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });

    const mainContent = page.locator('main, .min-h-screen').first();
    const toolCards = mainContent.locator('a[href*="/furinakit/"]');

    // Get initial count
    const initialCount = await toolCards.count();

    // Search for something specific
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('pdf');
    await page.waitForTimeout(500);

    // Verify filtering happened
    const filteredCount = await toolCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Verify all tools are restored
    const restoredCount = await toolCards.count();
    expect(restoredCount).toBe(initialCount);
  });

  test('should filter tools on category page', async ({ page }) => {
    await page.goto('/furinakit/text');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });

    // Get initial count
    const toolCards = page.locator('.grid a[href*="/furinakit/"]');
    const initialCount = await toolCards.count();

    // Search for a specific tool
    const searchInput = page.locator('input[placeholder]').first();
    await searchInput.fill('json');
    await page.waitForTimeout(500);

    const filteredCount = await toolCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });
});
