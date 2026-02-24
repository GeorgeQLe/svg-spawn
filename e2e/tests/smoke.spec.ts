import { test, expect } from '@playwright/test';

test('page loads with SVG Spawn title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SVG Spawn' })).toBeVisible();
});

test('page has correct document title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('SVG Spawn');
});
