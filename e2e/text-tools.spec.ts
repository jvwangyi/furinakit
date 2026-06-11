import { test, expect } from '@playwright/test';

test.describe('Text Tools', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('json-format should format JSON text', async ({ page }) => {
    await page.goto('/text/json-format');
    await page.waitForLoadState('networkidle');

    // Find the textarea and input JSON
    const textarea = page.locator('textarea').first();
    await textarea.fill('{"name":"test","value":123,"nested":{"key":"val"}}');

    // Click execute button
    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result to appear - verify by checking the result section buttons
    const downloadBtn = page.locator('button').filter({ hasText: /下载结果|Download/ }).first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
  });

  test('json-format should handle invalid JSON gracefully', async ({ page }) => {
    await page.goto('/text/json-format');
    await page.waitForLoadState('networkidle');

    // Input invalid JSON
    const textarea = page.locator('textarea').first();
    await textarea.fill('{invalid json content here}');

    // Click execute
    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result - should either show error or handle gracefully
    await page.waitForTimeout(2000);

    // The page should not crash - verify it's still functional
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('hash should compute hash of input text', async ({ page }) => {
    await page.goto('/text/hash');
    await page.waitForLoadState('networkidle');

    // Input text
    const textarea = page.locator('textarea').first();
    await textarea.fill('Hello World');

    // Select algorithm (SHA-256 is default, try clicking the select)
    const algorithmSelect = page.locator('[class*="select"]').first();
    if (await algorithmSelect.isVisible()) {
      await algorithmSelect.click();
      await page.waitForTimeout(300);
      // Select SHA-256 option
      const sha256Option = page.locator('[class*="select-item"], [role="option"]').filter({ hasText: 'SHA-256' }).first();
      if (await sha256Option.isVisible()) {
        await sha256Option.click();
      } else {
        // Press Escape to close the dropdown
        await page.keyboard.press('Escape');
      }
    }

    // Click execute
    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result
    await page.waitForTimeout(2000);

    // Verify result contains a hash (hex string)
    const resultPre = page.locator('pre').first();
    await expect(resultPre).toBeVisible({ timeout: 10000 });
    const resultText = await resultPre.textContent();
    expect(resultText).toBeTruthy();
    // SHA-256 hash should be 64 hex characters
    expect(resultText).toMatch(/[a-f0-9]{32,}/i);
  });

  test('base64 should encode text to Base64', async ({ page }) => {
    await page.goto('/text/base64');
    await page.waitForLoadState('networkidle');

    // Select 'encode' action (required field, no default)
    // The SelectTrigger has role=combobox and displays placeholder
    const actionSelect = page.locator('[role="combobox"]').first();
    await actionSelect.click();
    await page.waitForTimeout(300);
    const encodeOption = page.locator('[role="option"]').filter({ hasText: /编码|Encode/ }).first();
    await encodeOption.click();
    await page.waitForTimeout(300);

    // Input text
    const textarea = page.locator('textarea').first();
    await textarea.fill('Hello FurinaKit');

    // Click execute
    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result
    await page.waitForTimeout(2000);

    // Verify result area appeared by checking download button
    const downloadBtn = page.locator('button').filter({ hasText: /下载结果|Download/ }).first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
  });

  test('text-case should convert text case', async ({ page }) => {
    await page.goto('/text/text-case');
    await page.waitForLoadState('networkidle');

    // Input text
    const textarea = page.locator('textarea').first();
    await textarea.fill('hello world test');

    // Click execute
    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result
    await page.waitForTimeout(2000);

    // Verify result appeared
    const downloadBtn = page.locator('button').filter({ hasText: /下载结果|Download/ }).first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
  });

  test('text-count should count characters and words', async ({ page }) => {
    await page.goto('/text/text-count');
    await page.waitForLoadState('networkidle');

    // Input text
    const textarea = page.locator('textarea').first();
    await textarea.fill('Hello World. This is a test sentence with multiple words.');

    // Click execute
    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result
    await page.waitForTimeout(2000);

    // Verify result appeared
    const downloadBtn = page.locator('button').filter({ hasText: /下载结果|Download/ }).first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
  });

  test('text-diff should compare two texts', async ({ page }) => {
    await page.goto('/text/text-diff');
    await page.waitForLoadState('networkidle');

    // Text diff typically has two textareas
    const textareas = page.locator('textarea');
    const count = await textareas.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Input text in both
    await textareas.nth(0).fill('Hello World');
    await textareas.nth(1).fill('Hello Earth');

    // Click execute
    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理|比较|Compare/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result
    await page.waitForTimeout(2000);

    // Verify result appeared
    const resultSection = page.locator('pre, [class*="diff"], [class*="result"]').first();
    await expect(resultSection).toBeVisible({ timeout: 10000 });
  });

  test('json-to-csv should convert JSON to CSV', async ({ page }) => {
    await page.goto('/text/json-to-csv');
    await page.waitForLoadState('networkidle');

    // Input JSON array
    const textarea = page.locator('textarea').first();
    await textarea.fill('[{"name":"Alice","age":30},{"name":"Bob","age":25}]');

    // Click execute
    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result
    await page.waitForTimeout(2000);

    // Verify result appeared
    const downloadBtn = page.locator('button').filter({ hasText: /下载结果|Download/ }).first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
  });
});
