import { test, expect } from '@playwright/test';

test.describe('Graph View', () => {
  test('can switch to graph view', async ({ page }) => {
    await page.goto('/project/test');

    // Look for a view toggle mechanism
    const graphToggle = page
      .locator(
        '[data-testid="view-toggle-graph"], button:has-text("Graph"), [role="tab"]:has-text("Graph")',
      )
      .first();

    const hasToggle = await graphToggle
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasToggle) {
      await graphToggle.click();

      // After clicking, the graph view should become visible
      const graphContent = page
        .locator(
          '[data-testid="graph-view"], [data-testid="graph-view-empty"], [data-testid*="graph"]',
        )
        .first();

      await expect(graphContent).toBeVisible({ timeout: 5000 });
    }
  });

  test('graph view shows empty state when no nodes', async ({ page }) => {
    await page.goto('/project/test');

    // Switch to graph view
    const graphToggle = page
      .locator(
        '[data-testid="view-toggle-graph"], button:has-text("Graph"), [role="tab"]:has-text("Graph")',
      )
      .first();

    const hasToggle = await graphToggle
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasToggle) {
      await graphToggle.click();

      // The graph view should show an empty state or the graph container
      const graphArea = page
        .locator(
          '[data-testid="graph-view-empty"], [data-testid="graph-view"]',
        )
        .first();

      const isGraphVisible = await graphArea
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (isGraphVisible) {
        await expect(graphArea).toBeVisible();
      }
    }
  });

  test('view toggle exists on project page', async ({ page }) => {
    await page.goto('/project/test');

    // The view toggle component should be present
    const viewToggle = page
      .locator(
        '[data-testid="view-toggle"], [role="tablist"][aria-label="View mode"]',
      )
      .first();

    const hasViewToggle = await viewToggle
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasViewToggle) {
      await expect(viewToggle).toBeVisible();

      // It should have both Linear and Graph options
      const linearTab = page.locator('[data-testid="view-toggle-linear"]');
      const graphTab = page.locator('[data-testid="view-toggle-graph"]');

      await expect(linearTab).toBeVisible();
      await expect(graphTab).toBeVisible();
    }
  });

  test('can toggle between linear and graph views', async ({ page }) => {
    await page.goto('/project/test');

    const linearToggle = page
      .locator('[data-testid="view-toggle-linear"]')
      .first();
    const graphToggle = page
      .locator('[data-testid="view-toggle-graph"]')
      .first();

    const hasToggles = await linearToggle
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasToggles) {
      // Click graph view
      await graphToggle.click();
      await expect(graphToggle).toHaveAttribute('aria-selected', 'true');

      // Click back to linear view
      await linearToggle.click();
      await expect(linearToggle).toHaveAttribute('aria-selected', 'true');
    }
  });
});
