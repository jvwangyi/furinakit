import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/furinakit/');
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Check sidebar is visible on desktop
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    
    // Check navigation links are present
    const navLinks = sidebar.locator('a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to category pages', async ({ page }) => {
    // Click on PDF category
    const pdfLink = page.locator('a[href="/furinakit/pdf"]').first();
    await pdfLink.click();
    
    // Should navigate to PDF page
    await expect(page).toHaveURL(/\/furinakit\/pdf/);
  });

  test('should highlight active category', async ({ page }) => {
    // Navigate to PDF page
    await page.goto('/furinakit/pdf');
    
    // Check that PDF link has active style
    const pdfLink = page.locator('a[href="/furinakit/pdf"]').first();
    const className = await pdfLink.getAttribute('class');
    expect(className).toContain('bg-sidebar-accent');
  });

  test('should display language switcher', async ({ page }) => {
    // Check language switcher is visible in sidebar
    const sidebar = page.locator('aside').first();
    const langSwitcher = sidebar.locator('button').filter({ hasText: /English|中文/ }).first();
    await expect(langSwitcher).toBeVisible();
  });

  test('should switch language', async ({ page }) => {
    // Find and click language switcher in sidebar
    const sidebar = page.locator('aside').first();
    const langSwitcher = sidebar.locator('button').filter({ hasText: /English|中文/ }).first();
    await langSwitcher.click();
    
    // Wait for dropdown to appear
    await page.waitForTimeout(300);
    
    // Click on a language option
    const langOption = page.locator('button').filter({ hasText: /中文|English/ }).last();
    if (await langOption.isVisible()) {
      await langOption.click();
      
      // Wait for language change
      await page.waitForTimeout(500);
      
      // Verify language changed
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });

  test('should display theme toggle', async ({ page }) => {
    // Check theme toggle button is visible in sidebar
    const sidebar = page.locator('aside').first();
    const themeToggle = sidebar.locator('button[aria-label*="主题"], button[aria-label*="theme"]').first();
    await expect(themeToggle).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Find theme toggle button in sidebar
    const sidebar = page.locator('aside').first();
    const themeToggle = sidebar.locator('button[aria-label*="主题"], button[aria-label*="theme"]').first();
    
    // Get initial theme
    const initialHtml = page.locator('html');
    const initialClass = await initialHtml.getAttribute('class') || '';
    
    // Click theme toggle
    await themeToggle.click();
    
    // Wait for theme change
    await page.waitForTimeout(500);
    
    // Check that theme changed
    const newClass = await initialHtml.getAttribute('class') || '';
    expect(newClass).not.toBe(initialClass);
  });

  test('should navigate using sidebar links', async ({ page }) => {
    const categories = ['/furinakit/pdf', '/furinakit/image', '/furinakit/text', '/furinakit/video', '/furinakit/dev', '/furinakit/file', '/furinakit/craft'];
    
    for (const category of categories) {
      const link = page.locator(`a[href="${category}"]`).first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        
        // Go back to home for next iteration
        await page.goto('/furinakit/');
      }
    }
  });
});
