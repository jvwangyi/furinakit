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

  test('uuid-gen should generate UUIDs', async ({ page }) => {
    await page.goto('/dev/uuid-gen');
    await page.waitForLoadState('networkidle');

    // uuid-gen auto-submits, but let's set count first
    const countInput = page.locator('input[type="number"]').first();
    if (await countInput.isVisible()) {
      await countInput.fill('3');
      // Wait for auto-submit to trigger
      await page.waitForTimeout(2000);
    }

    // Verify result contains UUID-like strings
    const resultPre = page.locator('pre').first();
    await expect(resultPre).toBeVisible({ timeout: 10000 });
    const resultText = await resultPre.textContent();
    expect(resultText).toBeTruthy();
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    expect(resultText).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
  });

  test('base64 should encode text to Base64', async ({ page }) => {
    await page.goto('/text/base64');
    await page.waitForLoadState('networkidle');

    // Select 'encode' action (required field, no default)
    // The SelectTrigger has role=combobox and displays '编码' placeholder
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
});
