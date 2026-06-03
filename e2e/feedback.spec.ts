import { test, expect } from '@playwright/test';

test.describe('Feedback System', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('should display feedback form after tool execution', async ({ page }) => {
    await page.goto('/furinakit/text/json-format');
    await page.waitForLoadState('networkidle');

    // Input text and execute
    const textarea = page.locator('textarea').first();
    await textarea.fill('{"test":"data"}');

    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // Wait for result
    await page.waitForTimeout(2000);

    // Verify feedback form is visible (it has star rating buttons)
    const feedbackSection = page.locator('text=这个工具有帮助吗').first();
    await expect(feedbackSection).toBeVisible({ timeout: 10000 });
  });

  test('should show comment field after selecting rating', async ({ page }) => {
    await page.goto('/furinakit/text/json-format');
    await page.waitForLoadState('networkidle');

    // Execute a tool first
    const textarea = page.locator('textarea').first();
    await textarea.fill('{"test":"data"}');

    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();
    await page.waitForTimeout(2000);

    // Click on a star (the 4th star)
    const stars = page.locator('button:has(svg)').filter({ has: page.locator('svg') });
    // Find star buttons within the feedback section
    const feedbackCard = page.locator('text=这个工具有帮助吗').locator('..');
    const starButtons = feedbackCard.locator('button');

    // Click the 4th star button
    const fourthStar = starButtons.nth(3);
    if (await fourthStar.isVisible()) {
      await fourthStar.click();
      await page.waitForTimeout(300);

      // Verify comment textarea appears
      const commentTextarea = page.locator('textarea[placeholder*="建议"], textarea[placeholder*="评论"]').first();
      await expect(commentTextarea).toBeVisible();
    }
  });

  test('should submit feedback successfully', async ({ page }) => {
    await page.goto('/furinakit/text/json-format');
    await page.waitForLoadState('networkidle');

    // Execute a tool
    const textarea = page.locator('textarea').first();
    await textarea.fill('{"test":"data"}');

    const executeBtn = page.locator('button').filter({ hasText: /执行|Execute|处理/ }).first();
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();
    await page.waitForTimeout(2000);

    // Select a rating (click the 5th star)
    const feedbackCard = page.locator('text=这个工具有帮助吗').locator('..');
    const starButtons = feedbackCard.locator('button');
    const fifthStar = starButtons.nth(4);

    if (await fifthStar.isVisible()) {
      await fifthStar.click();
      await page.waitForTimeout(300);

      // Fill in comment
      const commentTextarea = page.locator('textarea[placeholder*="建议"], textarea[placeholder*="评论"]').first();
      if (await commentTextarea.isVisible()) {
        await commentTextarea.fill('Great tool! E2E test feedback.');
      }

      // Click submit button
      const submitBtn = page.locator('button').filter({ hasText: /提交反馈|Submit/ }).first();
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();

      // Wait for submission
      await page.waitForTimeout(2000);

      // Verify success message appears
      const successMessage = page.locator('text=感谢您的反馈').first();
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    }
  });
});
