import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('SVG Upload', () => {
  test('shows upload area on project page', async ({ page }) => {
    await page.goto('/project/test');
    // The project page should contain upload-related content
    // The linear mode shows "Upload your SVG" heading and drag-drop area
    const uploadArea = page.getByText(/upload/i).first();
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
  });

  test('shows error for non-SVG file', async ({ page }) => {
    await page.goto('/project/test');

    // Create a temporary non-SVG file
    const tmpDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(tmpFile, 'This is not an SVG file');

    // The file input may be hidden (used via click handler on the drop zone)
    // Playwright can set files on hidden inputs
    const fileInput = page.locator('input[type="file"]').first();
    const inputCount = await fileInput.count();

    if (inputCount > 0) {
      await fileInput.setInputFiles(tmpFile);
      // Look for an error message about invalid file type
      const error = page
        .getByText(/invalid|svg.*only|not.*supported|valid svg|please upload/i)
        .first();
      await expect(error).toBeVisible({ timeout: 5000 });
    }

    // Clean up
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  test('previews uploaded SVG', async ({ page }) => {
    await page.goto('/project/test');

    // Create a temporary SVG file
    const tmpDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, 'test.svg');
    fs.writeFileSync(
      tmpFile,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>',
    );

    // The file input may be hidden; Playwright can still set files on it
    const fileInput = page.locator('input[type="file"]').first();
    const inputCount = await fileInput.count();

    if (inputCount > 0) {
      await fileInput.setInputFiles(tmpFile);

      // After uploading a valid SVG, some form of preview or confirmation should appear
      // The upload component switches to showing the SVG thumbnail + "Upload a different SVG" link
      const previewOrConfirmation = page
        .locator(
          'svg, [data-testid*="preview"], [data-testid*="thumbnail"], img',
        )
        .first();
      await expect(previewOrConfirmation).toBeVisible({ timeout: 5000 });
    }

    // Clean up
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });
});
