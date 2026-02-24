import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

function createTestSvg(): { filePath: string; cleanup: () => void } {
  const tmpDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, `test-${Date.now()}.svg`);
  fs.writeFileSync(
    filePath,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>',
  );
  return {
    filePath,
    cleanup: () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    },
  };
}

test.describe('End-to-End Generation Flow', () => {
  test('can navigate from home to project', async ({ page }) => {
    await page.goto('/');

    // Click the New Project button
    const newProjectButton = page.locator('button:has-text("New Project")');
    await expect(newProjectButton).toBeVisible({ timeout: 10000 });
    await newProjectButton.click();

    // Should navigate to a project page
    await page.waitForURL(/\/project\//, { timeout: 10000 });
    expect(page.url()).toContain('/project/');
  });

  test('full linear flow: upload then prompt then preview', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("New Project")').click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });

    // Step 1: Upload SVG
    const { filePath, cleanup } = createTestSvg();
    try {
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(filePath);

      // Wait for SVG preview to appear (shows the uploaded SVG thumbnail)
      const previewOrThumbnail = page
        .locator('svg, [data-testid*="thumbnail"]')
        .first();
      await expect(previewOrThumbnail).toBeVisible({ timeout: 5000 });

      // Click Continue to move to prompt step
      const continueButton = page.locator('button:has-text("Continue")').first();
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      await continueButton.click();

      // Step 2: Enter prompt and submit
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 5000 });
      await textarea.fill('Make this circle pulse with a glow effect');

      const generateButton = page.locator('button:has-text("Generate Animation")');
      await expect(generateButton).toBeEnabled({ timeout: 5000 });
      await generateButton.click();

      // Should show generating state
      const generatingIndicator = page.locator('button:has-text("Generating")');
      await expect(generatingIndicator).toBeVisible({ timeout: 5000 });

      // Step 3: Wait for preview to appear (mock generation takes ~2 seconds)
      const previewHeading = page.getByText('Preview your animation');
      await expect(previewHeading).toBeVisible({ timeout: 15000 });

      // The animated SVG preview should be visible
      const animatedPreview = page.locator('.flex.items-center.justify-center.overflow-hidden').first();
      await expect(animatedPreview).toBeVisible({ timeout: 5000 });
    } finally {
      cleanup();
    }
  });

  test('can reach export step after generation', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("New Project")').click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });

    // Upload SVG
    const { filePath, cleanup } = createTestSvg();
    try {
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(filePath);

      // Continue to prompt
      const continueButton = page.locator('button:has-text("Continue")').first();
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      await continueButton.click();

      // Enter prompt and generate
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 5000 });
      await textarea.fill('Animate with a bounce effect');
      await page.locator('button:has-text("Generate Animation")').click();

      // Wait for preview step
      await expect(page.getByText('Preview your animation')).toBeVisible({
        timeout: 15000,
      });

      // Click Continue to Export
      const exportButton = page.locator('button:has-text("Continue to Export")');
      await expect(exportButton).toBeVisible({ timeout: 5000 });
      await exportButton.click();

      // Should now see the export step
      const exportHeading = page.getByText('Export your animation');
      await expect(exportHeading).toBeVisible({ timeout: 5000 });

      // The Download SVG button should be visible
      const downloadButton = page.locator('button:has-text("Download SVG")');
      await expect(downloadButton).toBeVisible({ timeout: 5000 });
    } finally {
      cleanup();
    }
  });

  test('can try a variation from preview step', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("New Project")').click();
    await page.waitForURL(/\/project\//, { timeout: 10000 });

    // Upload SVG
    const { filePath, cleanup } = createTestSvg();
    try {
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(filePath);

      const continueButton = page.locator('button:has-text("Continue")').first();
      await expect(continueButton).toBeVisible({ timeout: 5000 });
      await continueButton.click();

      // Generate
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 5000 });
      await textarea.fill('Spin animation');
      await page.locator('button:has-text("Generate Animation")').click();

      // Wait for preview
      await expect(page.getByText('Preview your animation')).toBeVisible({
        timeout: 15000,
      });

      // Click Try a variation
      const variationButton = page.locator('button:has-text("Try a variation")');
      await expect(variationButton).toBeVisible({ timeout: 5000 });
      await variationButton.click();

      // Should go back to prompt step
      const promptHeading = page.getByText('Describe the animation');
      await expect(promptHeading).toBeVisible({ timeout: 5000 });
    } finally {
      cleanup();
    }
  });
});
