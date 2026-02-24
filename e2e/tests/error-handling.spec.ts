import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Error Handling', () => {
  test('shows error for non-SVG file upload', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("New Project")').click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });

    // Create a non-SVG file
    const tmpDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, `test-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'This is not an SVG file');

    try {
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(tmpFile);

      // Should show an error message about invalid file
      const errorMessage = page
        .getByText(/please upload.*svg|invalid|not.*svg/i)
        .first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  test('handles empty prompt gracefully', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("New Project")').click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });

    // Upload valid SVG first
    const tmpDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, `test-${Date.now()}.svg`);
    fs.writeFileSync(
      tmpFile,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="50" height="50" fill="red"/></svg>',
    );

    try {
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(tmpFile);

      // Continue to prompt step
      const continueButton = page.locator('button:has-text("Continue")').first();
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      await continueButton.click();

      // The textarea should be visible
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 5000 });

      // Leave textarea empty - the Generate button should be disabled
      const generateButton = page.locator('button:has-text("Generate Animation")');
      await expect(generateButton).toBeDisabled({ timeout: 5000 });

      // Type only whitespace - button should still be disabled
      await textarea.fill('   ');
      await expect(generateButton).toBeDisabled();
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  test('shows toast notification on SVG upload', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("New Project")').click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });

    // Upload valid SVG
    const tmpDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, `test-${Date.now()}.svg`);
    fs.writeFileSync(
      tmpFile,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="green"/></svg>',
    );

    try {
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(tmpFile);

      // Click Continue to trigger the toast
      const continueButton = page.locator('button:has-text("Continue")').first();
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      await continueButton.click();

      // Should see a success toast notification
      const toast = page.locator('[data-testid="toast-success"]').first();
      await expect(toast).toBeVisible({ timeout: 5000 });
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  test('project page handles direct navigation', async ({ page }) => {
    // Navigate directly to a project page with a random ID
    const response = await page.goto('/project/nonexistent-test-id');

    // The page should still load without crashing
    expect(response?.status()).toBeLessThan(400);

    // Should show the upload step (linear mode default)
    const uploadContent = page.getByText(/upload/i).first();
    await expect(uploadContent).toBeVisible({ timeout: 10000 });
  });

  test('prompt character limit is enforced', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("New Project")').click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });

    // Upload valid SVG
    const tmpDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, `test-${Date.now()}.svg`);
    fs.writeFileSync(
      tmpFile,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="green"/></svg>',
    );

    try {
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(tmpFile);

      const continueButton = page.locator('button:has-text("Continue")').first();
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      await continueButton.click();

      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 5000 });

      // Type a very long prompt (over 1000 chars)
      const longPrompt = 'A'.repeat(1001);
      await textarea.fill(longPrompt);

      // The character counter should show the over-limit state
      const charCounter = page.getByText(/1001\/1000/);
      await expect(charCounter).toBeVisible({ timeout: 5000 });

      // The Generate button should be disabled
      const generateButton = page.locator('button:has-text("Generate Animation")');
      await expect(generateButton).toBeDisabled();
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
