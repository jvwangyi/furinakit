import { test, expect } from '@playwright/test';

test.describe('Tool Page', () => {
  test('should navigate to a text tool page', async ({ page }) => {
    // Navigate to a text tool (e.g., text-case)
    await page.goto('/text/text-case');
    
    // Check page loaded
    await expect(page.locator('h1, h2, [class*="card-title"]').first()).toBeVisible();
    
    // Check breadcrumb is visible
    const breadcrumb = page.locator('nav, [class*="breadcrumb"]').first();
    await expect(breadcrumb).toBeVisible();
  });

  test('should display tool options', async ({ page }) => {
    await page.goto('/text/text-case');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that tool options are displayed
    const options = page.locator('select, [class*="select"], input[type="radio"], [class*="radio"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display file upload area for file tools', async ({ page }) => {
    // Navigate to a file tool (e.g., pdf-merge)
    await page.goto('/pdf/pdf-merge');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check file upload area is visible
    const uploadArea = page.locator('[class*="dropzone"], [class*="upload"], input[type="file"]').first();
    await expect(uploadArea).toBeVisible();
  });

  test('should display execute button', async ({ page }) => {
    await page.goto('/text/text-case');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check execute button is visible
    const executeButton = page.locator('button:has-text("执行"), button:has-text("Execute"), button:has-text("处理")').first();
    await expect(executeButton).toBeVisible();
  });

  test('should navigate back to home from tool page', async ({ page }) => {
    await page.goto('/text/text-case');
    
    // Click on FurinaKit logo or home link - use the sidebar link
    const sidebar = page.locator('aside').first();
    const homeLink = sidebar.locator('a').first();
    await homeLink.click();
    
    // Should be back on homepage
    await expect(page).toHaveURL(/\/$|\/index/);
  });
});
